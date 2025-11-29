package com.chavna.pantryproject;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.Base64;


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



    @PostMapping("/scan-receipt")
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

            ReceiptParser parser = new ReceiptParser();

            for (Block block : detectResponse.blocks()) {
                if (block.blockType() == BlockType.LINE)
                    parser.addBlock(block);
            }

            return Response.Success(parser.getLines());
        } catch (IllegalArgumentException ex) {
            ex.printStackTrace();
            return Response.Error(HttpStatus.INTERNAL_SERVER_ERROR, "Base64 Decode Error");
        }
    }
}
