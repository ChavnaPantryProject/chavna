package com.chavna.pantryproject;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;

import java.util.Collections;
import java.util.List;
import java.util.Random;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import com.chavna.pantryproject.Uploader.Upload;

import io.jsonwebtoken.lang.Arrays;

@SpringBootTest
public class Tests {
    private static final int UPLOAD_TEST_COUNT = 10;

    @Test
    public void upload() {
        Random rng = new Random(0);
        Uploader uploader = Uploader.builder().build();

        for (int testNumber = 0; testNumber < UPLOAD_TEST_COUNT; testNumber++) {
            int fileSize = rng.nextInt(90 * 1024 * 1024, 110 * 1024 * 1024);
            byte[] bytes = new byte[fileSize];

            System.out.println("fileSize: " + fileSize);

            rng.nextBytes(bytes);

            Upload upload = uploader.initializeUpload(50 * 1024 * 1024, fileSize, null);

            Integer[] indices = new Integer[upload.getChunkCount()];
            for (int i = 0; i < upload.getChunkCount(); i++)
                indices[i] = i;
            List<Integer> indicesList = Arrays.asList(indices);
            Collections.shuffle(indicesList, rng);

            for (int i : indicesList) {
                int start = i * upload.getChunkSize();
                int end = Math.min(start + upload.getChunkSize(), fileSize);
                int size = end - start;

                byte[] chunk = new byte[size];
                System.arraycopy(bytes, start, chunk, 0, size);

                upload.uploadChunk(i, chunk);
            }

            byte[] data = upload.finish();
            assertArrayEquals(bytes, data);
        }
    }
}