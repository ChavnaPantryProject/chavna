
package com.chavna.pantryproject;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.chavna.pantryproject.ReceiptParser.Point;
import com.chavna.pantryproject.ReceiptParser.Word;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.textract.TextractClient;
import software.amazon.awssdk.services.textract.model.Block;
import software.amazon.awssdk.services.textract.model.BlockType;
import software.amazon.awssdk.services.textract.model.DetectDocumentTextRequest;
import software.amazon.awssdk.services.textract.model.DetectDocumentTextResponse;
import software.amazon.awssdk.services.textract.model.Document;

@RestController
public class OcrController {
    public static class ScanRequest {
        @NotNull
        public String base64Image;
    }
    //put items parsed here
    public static class ParsedItem {
        public String name;
        public String price;

        public ParsedItem(String name, String price) {
            this.name = name;
            this.price = price;
        }
    }

    @PostMapping("/scan-receipt")
    @SuppressWarnings("CatchAndPrintStackTrace")
    public Response scanReceipt(@Valid @RequestBody ScanRequest requestBody) {
        TextractClient textractClient = TextractClient.builder()
            .region(Region.US_EAST_1)
            .build();

        try {
            // I blatanly copy pasted this from Gemini

            // Remove the "data:image/png;base64," prefix if present
            if (requestBody.base64Image.startsWith("data:image"))
                requestBody.base64Image = requestBody.base64Image.substring(requestBody.base64Image.indexOf(",") + 1);
            
            // Decode the Base64 string to a byte array
            byte[] decodedBytes = Base64.getDecoder().decode(requestBody.base64Image);
            
            SdkBytes bytes = SdkBytes.fromByteArray(decodedBytes);
            Document document = Document.builder().bytes(bytes).build();

            DetectDocumentTextRequest detectRequest = DetectDocumentTextRequest.builder()
                    .document(document)
                    .build();
            DetectDocumentTextResponse detectResponse = textractClient.detectDocumentText(detectRequest);

            ArrayList<Word> words = new ArrayList<>();
            float totalAngle = 0;
            int count = 0;
            for (Block block : detectResponse.blocks()) {
                if (block.blockType() == BlockType.WORD) {
                    try {
                        List<software.amazon.awssdk.services.textract.model.Point> polygon = block.geometry().polygon();
                        var a  = polygon.get(0);
                        var b = polygon.get(1);
                        
                        float angle = (float) Math.atan2(b.y() - a.y(), b.x() - a.x());

                        totalAngle += angle;
                        count += 1;

                        Point[] points = new Point[polygon.size()];
                        for (int i = 0; i < polygon.size(); i++) {
                            var p = polygon.get(i);
                            points[i] = new Point(p.x(), p.y());
                        }

                        words.add(new Word(0, 0, 0, 0, points, block.text()));

                    } catch (NullPointerException ex) {
                        ex.printStackTrace();
                    }
                }
            }

            double avgAngle = totalAngle / count;

            ReceiptParser parser = new ReceiptParser();

            for (Word w : words) {
                Point[] polygon = w.getOriginalPolygon();

                Float minX = null;
                Float maxX = null;
                Float minY = null;
                Float maxY = null;

                // Rotate all points by -avgAngle to straighten the lines
                for (int i = 0; i < polygon.length; i++) {
                    Point point = polygon[i];
                    double x = point.x*Math.cos(-avgAngle) - point.y*Math.sin(-avgAngle);
                    double y = point.x*Math.sin(-avgAngle) + point.y*Math.cos(-avgAngle);

                    if (minX == null || x < minX) minX = (float) x;
                    if (maxX == null || x > maxX) maxX = (float) x;
                    if (minY == null || y < minY) minY = (float) y;
                    if (maxY == null || y > maxY) maxY = (float) y;
                }

                parser.addWord(new Word(
                        minX != null ? minX : 0,
                        minY != null ? minY : 0,
                        maxX != null ? maxX - minX : 0,
                        maxY != null ? maxY - minY : 0,
                        polygon,
                        w.getText()
                ));
            }

            List<List<Word>> lines = parser.getLines();
            List<ParsedItem> items = new ArrayList<>();

            Pattern pricePattern = Pattern.compile("\\d+\\.\\d{2}");
            java.util.function.Function<String, String> normalizeText = (s) -> s
                    .replaceAll("[Oo]", "0")
                    .replaceAll(",", ".")
                    .replaceAll("[^0-9A-Za-z.]",""); // remove weird OCR chars

            System.out.println("LOG Raw OCR Lines:");
            for (List<Word> line : lines) {
                StringBuilder rawLine = new StringBuilder();
                for (Word w : line) {
                    rawLine.append(w.getText()).append("\t");
                }
                System.out.println(rawLine.toString().trim());
            }

            // Improved Parsing Logic
            for (List<Word> line : lines) {
                line.sort((a, b) -> Float.compare(a.getX(), b.getX()));

                List<String> tokens = line.stream()
                        .map(w -> normalizeText.apply(w.getText()))
                        .filter(t -> !t.isEmpty())
                        .collect(Collectors.toList());

                String price = null;
                int priceIndex = -1;

                for (int i = 0; i < tokens.size(); i++) {
                    String token = tokens.get(i);
                    if (pricePattern.matcher(token).matches()) {
                        price = token;
                        priceIndex = i;
                        break;
                    }
                    if (i + 2 < tokens.size() &&
                        tokens.get(i).matches("\\d+") &&
                        tokens.get(i + 1).equals(".") &&
                        tokens.get(i + 2).matches("\\d{2}")) {
                        price = tokens.get(i) + "." + tokens.get(i + 2);
                        priceIndex = i;
                        break;
                    }
                }

                if (priceIndex == -1 || price == null || price.isEmpty()) continue;

                String itemName = tokens.subList(0, priceIndex).stream()
                        .filter(t -> !t.matches("\\d{4,}"))
                        .collect(Collectors.joining(" "));

                if (!itemName.isEmpty()) {
                    items.add(new ParsedItem(itemName.trim(), price));
                }
            }

            System.out.println("Parsed Items:");
            if (items.isEmpty()) {
                System.out.println("No parsed items found.");
            } else {
                items.forEach(item -> System.out.println(item.name + " -> " + item.price));
            }

            return Response.Success(items);

        } catch (IllegalArgumentException ex) {
            ex.printStackTrace();
            return Response.Error(HttpStatus.INTERNAL_SERVER_ERROR, "Base64 Decode Error");
        }
    }
}
