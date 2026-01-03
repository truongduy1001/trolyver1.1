import { GoogleGenAI } from "@google/genai";
import type { SpellCheckResult, ContractDetails, LegalEvaluationResult, ComparisonResult, OcrResult } from '../types';
import { readFileContent } from '../utils/fileReader';

/**
 * Khởi tạo instance AI. 
 * Trên Vercel, biến môi trường có thể được truy cập qua process.env.API_KEY
 */
const getAiClient = () => {
  const apiKey = (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Missing API_KEY. Hãy kiểm tra Environment Variables trên Vercel.");
  }
  return new GoogleGenAI({ apiKey });
};

const parseJsonFromAi = (text: string | undefined) => {
  if (!text) throw new Error("AI không trả về kết quả.");
  let cleanText = text.trim();
  
  // Loại bỏ các khối code markdown if any
  const jsonMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    cleanText = jsonMatch[1].trim();
  }

  try {
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error:", cleanText);
    throw new Error("Dữ liệu AI trả về không đúng định dạng JSON.");
  }
};

export const checkVietnameseSpelling = async (file: File, contractName: string): Promise<SpellCheckResult> => {
  const text = await readFileContent(file);
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Bạn là chuyên gia pháp lý. Hãy kiểm tra lỗi chính tả và thể thức văn bản tiếng Việt cho tài liệu sau (loại: ${contractName}). Trả về JSON.\n\nNội dung: ${text}`,
    config: { responseMimeType: "application/json" }
  });
  return parseJsonFromAi(response.text);
};

export const evaluateContractLegality = async (file: File, contractName: string): Promise<LegalEvaluationResult> => {
  const text = await readFileContent(file);
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Phân tích các rủi ro pháp lý và điểm số cho hợp đồng: ${contractName}. Trả về JSON.\n\nNội dung: ${text}`,
    config: { responseMimeType: "application/json" }
  });
  return parseJsonFromAi(response.text);
};

export const getContractDetails = async (contractName: string): Promise<ContractDetails> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Cung cấp chi tiết quy định pháp luật hiện hành và mẫu phụ lục cho: ${contractName}`
  });
  return { details: response.text || "Không tìm thấy dữ liệu." };
};

export const compareDocuments = async (file1: File, file2: File): Promise<ComparisonResult> => {
  const text1 = await readFileContent(file1);
  const text2 = await readFileContent(file2);
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `So sánh hai tài liệu pháp lý sau và trả về các đoạn trùng khớp trong định dạng JSON.\nTài liệu 1: ${text1}\nTài liệu 2: ${text2}`,
    config: { responseMimeType: "application/json" }
  });
  return parseJsonFromAi(response.text);
};

export const performOcr = async (file: File): Promise<OcrResult> => {
  const text = await readFileContent(file);
  return { text };
};