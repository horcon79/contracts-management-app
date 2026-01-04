"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
    file: string;
    onLoadSuccess?: (numPages: number) => void;
}

export function PDFViewer({ file, onLoadSuccess }: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [error, setError] = useState<string | null>(null);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setPageNumber(1);
        setError(null);
        onLoadSuccess?.(numPages);
    }

    function onDocumentLoadError(err: Error) {
        console.error("PDF Load Error:", err);
        setError(`Nie udało się załadować pliku PDF: ${err.message}`);
    }

    function goToPrevPage() {
        setPageNumber(Math.max(pageNumber - 1, 1));
    }

    function goToNextPage() {
        setPageNumber(Math.min(pageNumber + 1, numPages));
    }

    function zoomIn() {
        setScale(Math.min(scale + 0.25, 3.0));
    }

    function zoomOut() {
        setScale(Math.max(scale - 0.25, 0.5));
    }

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b bg-white">
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                        Strona {pageNumber} z {numPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={zoomOut}
                        disabled={scale <= 0.5}
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600 min-w-[60px] text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={zoomIn}
                        disabled={scale >= 3.0}
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* PDF Content */}
            <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
                {error ? (
                    <div className="flex flex-col items-center justify-center text-red-500 bg-red-50 p-8 rounded-lg border border-red-200 mt-10">
                        <p className="font-semibold mb-2">{error}</p>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            Spróbuj ponownie
                        </Button>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <Document
                            file={file}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            className="max-w-full"
                            loading={<p className="text-muted-foreground italic mt-10">Ładowanie dokumentu...</p>}
                        >
                            <Page
                                pageNumber={pageNumber}
                                scale={scale}
                                className="shadow-lg"
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                            />
                        </Document>
                    </div>
                )}
            </div>
        </div>
    );
}
