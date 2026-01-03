import { GoogleGenAI } from '@google/genai';
import type { SpellCheckResult, ContractDetails, LegalEvaluationResult, ComparisonResult, OcrResult } from '../types';
import { readFileContent } from '../utils/fileReader';

// Khởi tạo AI sử dụng API_KEY từ environment variable
const getAiInstance = () => {
  // Ưu tiên lấy từ process.env.API_KEY (đây là biến bạn cài trên Vercel)
  const apiKey = process.env.API_KEY || (import.meta as any).env.VITE_API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY không tồn tại. Vui lòng kiểm tra lại cấu hình Environment Variables trên Vercel.");
  }
  return new GoogleGenAI({ apiKey });
};

const parseGeminiJsonResponse = (response: any) => {
    const text = response.text;
    if (!text) throw new Error("AI không phản hồi nội dung.");
    
    let jsonString = text.trim();
    const markdownMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
        jsonString = markdownMatch[1].trim();
    }
    
    const startIndex = Math.min(
        jsonString.indexOf('{') === -1 ? Infinity : jsonString.indexOf('{'),
        jsonString.indexOf('[') === -1 ? Infinity : jsonString.indexOf('[')
    );
    const lastIndex = Math.max(jsonString.lastIndexOf('}'), jsonString.lastIndexOf(']'));

    if (startIndex === Infinity || lastIndex === -1) {
         throw new Error("Dữ liệu trả về không đúng định dạng JSON.");
    }

    return JSON.parse(jsonString.substring(startIndex, lastIndex + 1));
};

export const checkVietnameseSpelling = async (file: File, contractName: string): Promise<SpellCheckResult> => {
    const text = await readFileContent(file);
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Kiểm tra lỗi chính tả và thể thức văn bản tiếng Việt cho loại: ${contractName}\n\nNội dung:\n${text}`,
        config: { responseMimeType: "application/json" }
    });
    return parseGeminiJsonResponse(response);
};

export const evaluateContractLegality = async (file: File, contractName: string): Promise<LegalEvaluationResult> => {
    const text = await readFileContent(file);
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Phân tích rủi ro pháp lý cho hợp đồng: ${contractName}\n\nNội dung:\n${text}`,
        config: { responseMimeType: "application/json" }
    });
    return parseGeminiJsonResponse(response);
};

export const getContractDetails = async (contractName: string): Promise<ContractDetails> => {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Cung cấp kiến thức pháp lý chi tiết cho: ${contractName}`
    });
    return { details: response.text || "Không có dữ liệu." };
};

export const compareDocuments = async (file1: File, file2: File): Promise<ComparisonResult> => {
    const text1 = await readFileContent(file1);
    const text2 = await readFileContent(file2);
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `So sánh 2 văn bản pháp lý sau:\nTài liệu 1: ${text1}\nTài liệu 2: ${text2}`,
        config: { responseMimeType: "application/json" }
    });
    return parseGeminiJsonResponse(response);
};

export const performOcr = async (file: File): Promise<OcrResult> => {
    const text = await readFileContent(file);
    return { text };
};
