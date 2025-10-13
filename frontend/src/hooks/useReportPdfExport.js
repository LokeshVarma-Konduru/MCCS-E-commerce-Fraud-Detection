import { useCallback } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const createLoadingOverlay = (message) => {
  const loadingElement = document.createElement("div");
  loadingElement.style.position = "fixed";
  loadingElement.style.top = "50%";
  loadingElement.style.left = "50%";
  loadingElement.style.transform = "translate(-50%, -50%)";
  loadingElement.style.padding = "20px 28px";
  loadingElement.style.background = "rgba(255, 255, 255, 0.95)";
  loadingElement.style.borderRadius = "12px";
  loadingElement.style.boxShadow = "0 10px 30px rgba(15, 23, 42, 0.12)";
  loadingElement.style.fontSize = "16px";
  loadingElement.style.fontWeight = "600";
  loadingElement.style.color = "#1f2937";
  loadingElement.style.letterSpacing = "0.02em";
  loadingElement.style.zIndex = "9999";
  loadingElement.textContent = message;
  return loadingElement;
};

const defaultCloneAdjustments = (clonedDoc) => {
  const clonedReport = clonedDoc.querySelector(".report-container");
  if (!clonedReport) {
    return;
  }

  clonedReport.style.height = "auto";
  clonedReport.style.overflow = "visible";

  const header = clonedDoc.querySelector(".report-header");
  if (header) {
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.width = "100%";
    header.style.marginBottom = "40px";
    header.style.paddingBottom = "24px";
    header.style.borderBottom = "1px solid #e5e7eb";
  }

  const logoContainer = clonedDoc.querySelector(".logo-container");
  if (logoContainer) {
    logoContainer.style.width = "120px";
    logoContainer.style.display = "flex";
    logoContainer.style.justifyContent = "flex-start";
    logoContainer.style.alignItems = "center";
  }

  const titleContainer = clonedDoc.querySelector(".report-title");
  if (titleContainer) {
    titleContainer.style.textAlign = "center";
    titleContainer.style.flexGrow = "1";
    titleContainer.style.margin = "0";
    titleContainer.style.padding = "0 20px";
  }

  const actionsContainer = clonedDoc.querySelector(".report-actions");
  if (actionsContainer) {
    actionsContainer.style.display = "none";
  }

  const chartsGrid = clonedDoc.querySelector(".report-charts-grid");
  if (chartsGrid) {
    chartsGrid.style.display = "grid";
    chartsGrid.style.gridTemplateColumns = "1fr 1fr";
    chartsGrid.style.gap = "32px";
    chartsGrid.style.margin = "40px 0";
    chartsGrid.style.width = "100%";
  }

  const chartColumns = clonedDoc.querySelectorAll(".report-chart-column");
  chartColumns.forEach((column) => {
    column.style.background = "white";
    column.style.borderRadius = "12px";
    column.style.padding = "24px";
    column.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";
    column.style.border = "1px solid #e5e7eb";
    column.style.display = "flex";
    column.style.flexDirection = "column";
    column.style.height = "100%";
  });

  const chartContainers = clonedDoc.querySelectorAll(".report-chart-column .chart-container");
  chartContainers.forEach((container) => {
    container.style.height = "350px";
    container.style.flexGrow = "1";
    container.style.minHeight = "300px";
  });

  const sections = clonedReport.querySelectorAll(
    ".report-charts-grid, .report-charts, .report-metrics, .insights-section, .financial-metrics, .monthly-trends, .key-insights"
  );
  sections.forEach((section) => {
    section.style.display = section.classList.contains("report-charts-grid") ? "grid" : "block";
    section.style.visibility = "visible";
  });
};

const removeElement = (element) => {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
};

const resolveFileName = (fileName) => {
  if (!fileName) {
    return "report.pdf";
  }
  return typeof fileName === "function" ? fileName() : fileName;
};

const useReportPdfExport = (
  reportRef,
  {
    fileName,
    loadingMessage = "Generating PDF...",
    onClone,
    pdfOptions
  } = {}
) => {
  return useCallback(async () => {
    if (!reportRef?.current) {
      console.warn("useReportPdfExport: reportRef is not attached to an element.");
      return;
    }

    const loadingElement = createLoadingOverlay(loadingMessage);
    document.body.appendChild(loadingElement);

    try {
      const target = reportRef.current;
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: target.scrollWidth,
        windowHeight: target.scrollHeight,
        onclone: (clonedDoc) => {
          defaultCloneAdjustments(clonedDoc);
          if (onClone) {
            onClone(clonedDoc);
          }
        }
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? "portrait" : "landscape",
        unit: "mm",
        format: [imgWidth, imgHeight],
        ...pdfOptions
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(resolveFileName(fileName));
    } catch (error) {
      console.error("Failed to generate PDF report:", error);
      throw error;
    } finally {
      removeElement(loadingElement);
    }
  }, [fileName, loadingMessage, onClone, pdfOptions, reportRef]);
};

export default useReportPdfExport;
