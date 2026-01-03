import { GoogleGenAI } from '@google/genai';
import type { SpellCheckResult, ContractDetails, LegalEvaluationResult, ComparisonResult, OcrResult } from '../types';
import { readFileContent } from '../utils/fileReader';

// Hàm khởi tạo AI đảm bảo lấy đúng API Key từ môi trường Vercel
const getAiInstance = () => {
  // Trên Vercel, biến môi trường thường được truy cập qua process.env
  // Trong Vite dev, nó là import.meta.env
  const apiKey = (import.meta as any).env.VITE_API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("Chưa cấu hình API Key. Hãy thêm biến API_KEY vào Settings -> Environment Variables trên Vercel.");
  }
  return new GoogleGenAI({ apiKey });
};

const parseGeminiJsonResponse = (response: any) => {
    const rawText = response.text;
    if (!rawText) throw new Error("AI không phản hồi nội dung.");
    
    let jsonString = rawText.trim();
    // Loại bỏ các ký tự markdown nếu AI bao bọc kết quả trong ```json
    const markdownMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
        jsonString = markdownMatch[1].trim();
    }
    
    // Tìm vị trí bắt đầu của JSON ( { hoặc [ )
    const startIndex = Math.min(
        jsonString.indexOf('{') === -1 ? Infinity : jsonString.indexOf('{'),
        jsonString.indexOf('[') === -1 ? Infinity : jsonString.indexOf('[')
    );
    const lastIndex = Math.max(jsonString.lastIndexOf('}'), jsonString.lastIndexOf(']'));

    if (startIndex === Infinity || lastIndex === -1) {
         throw new Error("Dữ liệu AI trả về không phải JSON hợp lệ.");
    }

    return JSON.parse(jsonString.substring(startIndex, lastIndex + 1));
};

export const checkVietnameseSpelling = async (file: File, contractName: string): Promise<SpellCheckResult> => {
    const text = await readFileContent(file);
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Bạn là trợ lý pháp lý. Kiểm tra lỗi chính tả và thể thức văn bản tiếng Việt cho loại: ${contractName}. Trả về JSON.\n\nNội dung:\n${text}`,
        config: { 
            responseMimeType: "application/json" 
        }
    });
    return parseGeminiJsonResponse(response);
};

export const evaluateContractLegality = async (file: File, contractName: string): Promise<LegalEvaluationResult> => {
    const text = await readFileContent(file);
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Phân tích rủi ro pháp lý cho: ${contractName}. Trả về JSON với legalScore (0-100) và feedback array.\n\nNội dung:\n${text}`,
        config: { 
            responseMimeType: "application/json" 
        }
    });
    return parseGeminiJsonResponse(response);
};

export const getContractDetails = async (contractName: string): Promise<ContractDetails> => {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Cung cấp thông tin pháp luật chi tiết và các mẫu điều khoản quan trọng cho loại: ${contractName}`
    });
    return { details: response.text || "Không có dữ liệu." };
};

export const compareDocuments = async (file1: File, file2: File): Promise<ComparisonResult> => {
    const text1 = await readFileContent(file1);
    const text2 = await readFileContent(file2);
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `So sánh sự khác biệt và tìm các đoạn trùng khớp giữa hai tài liệu pháp lý sau. Trả về JSON.\nTài liệu 1: ${text1}\nTài liệu 2: ${text2}`,
        config: { 
            responseMimeType: "application/json" 
        }
    });
    return parseGeminiJsonResponse(response);
};

export const performOcr = async (file: File): Promise<OcrResult> => {
    const text = await readFileContent(file);
    return { text };
};