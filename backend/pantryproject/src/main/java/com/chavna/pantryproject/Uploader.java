package com.chavna.pantryproject;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder.Default;

@Builder
public class Uploader implements Runnable {
    public class Upload {
        @Getter
        private UUID uploadId;
        @Getter
        private int chunkSize;
        @Getter
        private int chunkCount;
        @Getter
        private int totalSize;
        @Getter
        private Object metadata;
        private Instant created;

        private HashMap<Integer, byte[]> chunks;

        private Upload(UUID uploadId, int chunkSize, int totalSize, Object metadata) {
            this.uploadId = uploadId;
            this.chunkSize = chunkSize;
            this.totalSize = totalSize;

            chunkCount = totalSize / chunkSize;
            int overflow = totalSize % chunkSize;

            if (overflow > 0)
                chunkCount++;

            this.metadata = metadata;

            this.chunks = new HashMap<>();

            created = Instant.now();
        }

        public void uploadChunk(int index, byte[] chunk) {
            if (chunks == null)
                throw new IllegalStateException("Upload has already been finished.");

            if (index < 0 || index >= chunkCount)
                throw new IndexOutOfBoundsException();

            int expectedSize = chunkSize;
            int overflow = totalSize % chunkSize;

            if (overflow > 0 && index == chunkCount - 1)
                expectedSize = overflow;

            if (chunk.length != expectedSize)
                throw new IllegalArgumentException("Incorrect chunk size. Expected: " + expectedSize + " Given: " + chunk.length);

            if (chunks.containsKey(index))
                throw new IllegalArgumentException("Chunk with that index has already been uploaded.");

            chunks.put(index, chunk);
        }

        public boolean isComplete() {
            if (chunks == null)
                throw new IllegalStateException("Upload has already been finished.");

            return chunks.size() == chunkCount;
        }

        public byte[] finish() {
            if (chunks == null)
                throw new IllegalStateException("Upload has already been finished.");

            if (chunks.size() < chunkCount)
                throw new IllegalStateException("Upload not completed.");

            byte[] bytes = new byte[totalSize];

            for (var entry : chunks.entrySet()) {
                int index = entry.getKey();
                byte[] chunk = entry.getValue();

                System.arraycopy(chunk, 0, bytes, index * chunkSize, chunk.length);
            }

            this.chunks = null;
            uploads.remove(uploadId);

            return bytes;
        }
    }

    private final HashMap<UUID, Upload> uploads = new HashMap<>();
    private final Thread cleanupThread = new Thread(this);

    @Getter @Default
    private Duration cleanupInterval = Duration.ofSeconds(30);
    @Getter @Setter @Default
    private Duration maxLifetime = Duration.ofMinutes(10);

    private Uploader(Duration cleanupInterval, Duration maxLifetime) {
        this.cleanupInterval = cleanupInterval;
        this.maxLifetime = maxLifetime;

        this.cleanupThread.start();
    }

    public Upload initializeUpload(int chunkSize, int totalSize, Object metadata) {
        UUID id = UUID.randomUUID();
        Upload upload = new Upload(id, chunkSize, totalSize, metadata);
        uploads.put(id, upload);

        return upload;
    }

    public Upload initializeUpload(int chunkSize, int totalSize) {
        return initializeUpload(chunkSize, totalSize, null);
    }

    public Upload getUpload(UUID uploadId) {
        return uploads.get(uploadId);
    }

    public void setCleanupInterval(Duration interval) {
        cleanupInterval = interval;

        cleanupThread.interrupt();
    }

    private void cleanup() {
        var iterator = uploads.values().iterator();
        while (iterator.hasNext()) {
            Upload upload = iterator.next();

            if (Duration.between(upload.created, Instant.now()).compareTo(maxLifetime) >= 0)
                iterator.remove();
        }
    }

    @Override
    @SuppressWarnings("EmptyCatch")
    public void run() {
        while (true) {
            try {
                cleanup();
            } catch (Exception ex) {}
            try {
                Thread.sleep(cleanupInterval.toMillis());
            } catch (InterruptedException ex) {}
        }
    }
}
