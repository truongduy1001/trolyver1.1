import { GoogleGenAI } from "@google/genai";
import type { SpellCheckResult, ContractDetails, LegalEvaluationResult, ComparisonResult, OcrResult } from '../types';
import { readFileContent } from '../utils/fileReader';

/**
 * Khởi tạo instance AI duy nhất. 
 * API Key được lấy trực tiếp từ environment variable process.env.API_KEY.
 */
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const parseJsonFromAi = (text: string | undefined) => {
  if (!text) throw new Error("AI không trả về kết quả.");
  let cleanText = text.trim();
  
  // Xử lý trường hợp AI trả về markdown code block
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```/, "").replace(/```$/, "").trim();
  }
  
  try {
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Lỗi parse JSON từ AI:", cleanText);
    throw new Error("Dữ liệu AI trả về không đúng định dạng JSON.");
  }
};

export const checkVietnameseSpelling = async (file: File, contractName: string): Promise<SpellCheckResult> => {
  const text = await readFileContent(file);
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Bạn là một chuyên gia hiệu đính văn bản pháp lý. Hãy kiểm tra lỗi chính tả và thể thức cho tài liệu sau (Loại: ${contractName}). Trả về kết quả dưới dạng JSON.\n\nNội dung: ${text}`,
    config: {
      responseMimeType: "application/json"
    }
  });
  return parseJsonFromAi(response.text);
};

export const evaluateContractLegality = async (file: File, contractName: string): Promise<LegalEvaluationResult> => {
  const text = await readFileContent(file);
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Bạn là luật sư cao cấp. Phân tích rủi ro và chấm điểm pháp lý (0-100) cho hợp đồng: ${contractName}. Trả về JSON.\n\nNội dung: ${text}`,
    config: {
      responseMimeType: "application/json"
    }
  });
  return parseJsonFromAi(response.text);
};

export const getContractDetails = async (contractName: string): Promise<ContractDetails> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Cung cấp quy định pháp luật hiện hành và các điều khoản mẫu quan trọng cho loại hợp đồng: ${contractName}. Trình bày bằng Markdown.`
  });
  return { details: response.text || "Không tìm thấy dữ liệu." };
};

export const compareDocuments = async (file1: File, file2: File): Promise<ComparisonResult> => {
  const text1 = await readFileContent(file1);
  const text2 = await readFileContent(file2);
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `So sánh hai văn bản sau và chỉ ra các điểm tương đồng lớn. Trả về JSON.\n\nVăn bản 1: ${text1}\n\nVăn bản 2: ${text2}`,
    config: {
      responseMimeType: "application/json"
    }
  });
  return parseJsonFromAi(response.text);
};

export const performOcr = async (file: File): Promise<OcrResult> => {
  const text = await readFileContent(file);
  return { text };
};