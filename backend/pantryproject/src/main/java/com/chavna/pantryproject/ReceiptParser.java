package com.chavna.pantryproject;

import java.util.TreeSet;

import lombok.AllArgsConstructor;
import lombok.Getter;

public class ReceiptParser {
    @AllArgsConstructor
    public static class Word implements Cloneable, Comparable<Word> {
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

        public double getCharacterWidth() {
            return width / text.length();
        }

        public Word clone() {
            return new Word(x, y, width, height, text);
        }

        public int compareTo(Word other) {
            return Double.compare(x, other.x);
        }
    }

    public static class LineBlock implements Comparable<LineBlock> {
        @Getter
        private double x;
        @Getter
        private double y;
        @Getter
        private double width;
        @Getter
        private double height;
        private Word[] words;

        private LineBlock(Word[] words) {
            this.words = words;

            Double x = null;
            for (Word w : words) {
                if (x == null || w.x < x)
                    x = w.x;
            }
            this.x = x != null? x : 0;

            Double y = null;
            for (Word w : words) {
                if (y == null || w.y < y)
                    y = w.y;
            }
            this.y = y != null? y : 0;

            Double xMax = null;
            for (Word w : words) {
                if (xMax == null || w.x + w.width > xMax)
                    xMax = w.x + w.width;
            }
            width = (xMax != null? xMax : 0) - this.x;

            Double yMax = null;
            for (Word w : words) {
                if (yMax == null || w.y + w.height > yMax)
                    yMax = w.y + w.height;
            }
            height = (yMax != null? yMax : 0) - this.y;
        }

        public LineBlock(Word word) {
            this(new Word[] {word});
        }

        @Override
        public int compareTo(LineBlock other) {
            double aCenter = centerY();
            double bCenter = other.centerY();

            // If either block's y center is within the other's y bounds, they are considered on the same line.
            if ((bCenter <= y + height && bCenter >= y) || (aCenter <= other.y + other.height && aCenter >= other.y))
                return 0;

            // Otherwise compare the y position of their centers
            return Double.compare(aCenter, bCenter);
        }

        public double centerY() {
            return getY() + getHeight() / 2.0;
        }

        public Word[] getWords() {
            Word[] out = new Word[words.length];

            for (int i = 0; i < words.length; i++)
                out[i] = words[i].clone();

            return out;
        }

        public static LineBlock combine(LineBlock a, LineBlock b) {
            TreeSet<Word> wordSet = new TreeSet<>();

            for (Word w : a.words)
                wordSet.add(w);

            for (Word w : b.words)
                wordSet.add(w);

            Word[] words = new Word[wordSet.size()];
            wordSet.toArray(words);

            return new LineBlock(words);
        }
    }

    private TreeSet<LineBlock> blocks;

    public ReceiptParser() {
        blocks = new TreeSet<>();
    }

    public void addWord(Word word) {
        LineBlock textBlock = new LineBlock(word);

        LineBlock existing = blocks.ceiling(textBlock);

        if (existing != null && existing.compareTo(textBlock) != 0)
            existing = null;

        if (existing != null) {
            blocks.remove(existing);
            textBlock = LineBlock.combine(existing, textBlock);
        }

        blocks.add(textBlock);
    }

    public LineBlock[] getLines() {
        LineBlock[] out = new LineBlock[blocks.size()];
        blocks.toArray(out);

        return out;
    }
}
