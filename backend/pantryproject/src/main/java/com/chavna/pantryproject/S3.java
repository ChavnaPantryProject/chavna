package com.chavna.pantryproject;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import static com.chavna.pantryproject.Env.CHAVNA_URL;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.UUID;

import javax.imageio.ImageIO;

public class S3 {
    private static S3Client s3Client = S3Client.builder()
        .region(Region.US_EAST_1)
        .build();
    
    public static final String PICTURES_BUCKET = "chavna-pictures";

    public static void uploadImage(BufferedImage image, String key) {
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
            .bucket(PICTURES_BUCKET)
            .key(key)
            .build();

        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try {
            ImageIO.write(image, "JPG", bytes);
        } catch (IOException ex) {
            // I'm pretty sure ByteOutputStream will never actually throw, but just in case.
            throw new IllegalStateException(ex);
        }

        s3Client.putObject(putObjectRequest, RequestBody.fromBytes(bytes.toByteArray()));
    }

    public static byte[] getImage(String key) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
            .bucket(PICTURES_BUCKET)
            .key(key)
            .build();

        var response = s3Client.getObject(getObjectRequest);

        byte[] bytes;
        try {
            bytes = response.readAllBytes();
        } catch (IOException ex) {
            throw new RuntimeException("Failed to read bytes.", ex);
        }

        return bytes;
    }

    public static boolean imageExists(String key) {
        try {
            HeadObjectRequest request = HeadObjectRequest.builder()
                .bucket(PICTURES_BUCKET)
                .key(key)
                .build();
            
            s3Client.headObject(request);

            return true;
        } catch (NoSuchKeyException ex) {
            return false;
        }
    }

    public static String getImageKey(String prefix, UUID id) {
        return prefix + "-" + id.toString() + ".jpg";
    }

    public static String getImageURL(String key) {
        return CHAVNA_URL + "/images/" + key;
    }
}
