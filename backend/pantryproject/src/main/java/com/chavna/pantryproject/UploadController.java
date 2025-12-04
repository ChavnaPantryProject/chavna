package com.chavna.pantryproject;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.Duration;
import java.util.Base64;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.chavna.pantryproject.S3.S3Upload;
import com.chavna.pantryproject.Uploader.Upload;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

@RestController
public class UploadController {
    public static final Uploader uploader = Uploader.builder()
        .cleanupInterval(Duration.ofSeconds(30))
        .maxLifetime(Duration.ofMinutes(10))
        .build();
    
    public static final int UPLOAD_CHUNK_SIZE = 50 * 1024 * 1024;

    public static class UploadChunkRequest {
        @NotNull
        public UUID uploadId;
        public int index;
        @NotNull
        public String base64Data;
    }

    @PostMapping("/upload-chunk")
    public Response uploadChunk(@Valid @RequestBody UploadChunkRequest requestBody) {
        Upload upload = uploader.getUpload(requestBody.uploadId);
        if (upload == null)
            return Response.Fail("Invalid uploadId.");


        // I blatanly copy pasted this from Gemini

        // Remove the "data:image/png;base64," prefix if present
        if (requestBody.base64Data.startsWith("data:image"))
            requestBody.base64Data = requestBody.base64Data.substring(requestBody.base64Data.indexOf(",") + 1);
        
        byte[] decodedBytes;
        try {
            // Decode the Base64 string to a byte array
            decodedBytes = Base64.getDecoder().decode(requestBody.base64Data);
        } catch (IllegalArgumentException ex) {
            return Response.Fail("Invalid base64 string.");
        }

        upload.uploadChunk(requestBody.index, decodedBytes);

        if (upload.isComplete()) {
            if (upload.getMetadata() instanceof S3Upload) {
                S3Upload s3Upload = (S3Upload) upload.getMetadata();

                byte[] bytes = upload.finish();
                ByteArrayInputStream byteStream = new ByteArrayInputStream(bytes);

                BufferedImage image = null;
                try {
                    image = ImageIO.read(byteStream);
                } catch (IOException ex) {}

                if (image == null)
                    return Response.Fail("Could not decode image.");

                S3.uploadImage(image, s3Upload.getKey());
            }

            return Response.Success("Upload complete.");
        }

        return Response.Success("Chunk uploaded successfully.");
    }
}
