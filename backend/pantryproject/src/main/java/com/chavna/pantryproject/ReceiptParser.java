package com.chavna.pantryproject;

import java.util.TreeSet;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import software.amazon.awssdk.services.textract.model.Block;
import software.amazon.awssdk.services.textract.model.BlockType;
import software.amazon.awssdk.services.textract.model.BoundingBox;

public class ReceiptParser {
    @AllArgsConstructor(access = AccessLevel.PRIVATE)
    private static class TextLineBlock implements Comparable<TextLineBlock> {
        @Getter
        private double x;
        @Getter
        private double y;
        @Getter
        private double width;
        @Getter
        private double height;
        @Getter
        private String text;

        @Override
        public int compareTo(TextLineBlock other) {
            double aCenter = getCenterY();
            double bCenter = other.getCenterY();

            // If either block's y center is within the other's y bounds, they are considered on the same line.
            if ((bCenter <= y + height && bCenter >= y) || (aCenter <= other.height && aCenter >= other.y))
                return 0;

            // Otherwise compare the y position of their centers
            return Double.compare(aCenter, bCenter);
        }

        public double getCenterY() {
            return y + height / 2.0;
        }

        public double getCharacterWidth() {
            return width / text.length();
        }

        public static TextLineBlock combine(TextLineBlock a, TextLineBlock b) {
            // Use avg character width to calculate total line length
            double characterWidth = (a.getCharacterWidth() + b.getCharacterWidth()) / 2.0;

            double x = Double.min(a.x, b.x);
            double y = Double.min(a.y, b.y);
            double width = Double.max(a.x + a.width, b.x + b.width) - x;
            double height = Double.max(a.y + a.height, b.y + b.height) - y;

            int textLength = (int) Math.round(width / characterWidth);
            textLength = textLength * 3 / 2; // Add some extra space just in case.
            StringBuilder combinedText = new StringBuilder(new String(new char[textLength]).replace('\0', ' '));

            int aStart = (int) ((a.x - x) / characterWidth);
            int bStart = (int) ((b.x - x) / characterWidth);

            combinedText.replace(aStart, aStart + a.text.length(), a.text);
            combinedText.replace(bStart, bStart + b.text.length(), b.text);

            String text = combinedText.toString().stripTrailing();

            return new TextLineBlock(x, y, width, height, text);
        }
    }

    private TreeSet<TextLineBlock> blocks;

    public ReceiptParser() {
        blocks = new TreeSet<>();
    }

    public void addBlock(Block block) {
        if (block.blockType() != BlockType.LINE)
            throw new IllegalArgumentException("BlockType must be LINE.");

        BoundingBox boundingBox = block.geometry().boundingBox();
        TextLineBlock textBlock = new TextLineBlock(boundingBox.left(), boundingBox.top(), boundingBox.width(), boundingBox.height(), block.text());

        TextLineBlock existing = blocks.ceiling(textBlock);

        if (existing != null && existing.compareTo(textBlock) != 0)
            existing = null;

        if (existing != null) {
            blocks.remove(existing);
            textBlock = TextLineBlock.combine(existing, textBlock);
        }

        blocks.add(textBlock);
    }

    public String[] getLines() {
        String[] out = new String[blocks.size()];

        int i = 0;
        for (TextLineBlock line : blocks) {
            out[i] = line.text;
            i++;
        }

        return out;
    }
}
