import { GoogleGenAI } from "@google/genai";
import type { SpellCheckResult, ContractDetails, LegalEvaluationResult, ComparisonResult, OcrResult } from '../types';
import { readFileContent } from '../utils/fileReader';

/**
 * Khởi tạo AI sử dụng API_KEY từ environment variable của Vercel.
 */
const initAi = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Không tìm thấy API_KEY trong môi trường Vercel.");
  }
  return new GoogleGenAI({ apiKey });
};

const parseResponse = (response: any) => {
  const text = response.text;
  if (!text) throw new Error("AI không phản hồi.");
  
  let jsonStr = text.trim();
  if (jsonStr.includes("```json")) {
    jsonStr = jsonStr.split("```json")[1].split("```")[0].trim();
  } else if (jsonStr.includes("```")) {
    jsonStr = jsonStr.split("```")[1].split("```")[0].trim();
  }
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Lỗi parse JSON:", jsonStr);
    throw new Error("Dữ liệu AI trả về không đúng định dạng.");
  }
};

export const checkVietnameseSpelling = async (file: File, contractName: string): Promise<SpellCheckResult> => {
  const text = await readFileContent(file);
  const ai = initAi();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Kiểm tra lỗi chính tả tiếng Việt cho loại tài liệu: ${contractName}\nNội dung:\n${text}`,
    config: { responseMimeType: "application/json" }
  });
  return parseResponse(response);
};

export const evaluateContractLegality = async (file: File, contractName: string): Promise<LegalEvaluationResult> => {
  const text = await readFileContent(file);
  const ai = initAi();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Phân tích rủi ro pháp lý cho hợp đồng: ${contractName}\nNội dung:\n${text}`,
    config: { responseMimeType: "application/json" }
  });
  return parseResponse(response);
};

export const getContractDetails = async (contractName: string): Promise<ContractDetails> => {
  const ai = initAi();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Cung cấp thông tin pháp lý chi tiết về: ${contractName}`
  });
  return { details: response.text || "Không có dữ liệu." };
};

export const compareDocuments = async (file1: File, file2: File): Promise<ComparisonResult> => {
  const text1 = await readFileContent(file1);
  const text2 = await readFileContent(file2);
  const ai = initAi();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `So sánh 2 văn bản pháp lý:\n1: ${text1}\n2: ${text2}`,
    config: { responseMimeType: "application/json" }
  });
  return parseResponse(response);
};

export const performOcr = async (file: File): Promise<OcrResult> => {
  const text = await readFileContent(file);
  return { text };
};