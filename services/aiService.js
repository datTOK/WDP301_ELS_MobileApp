import api from "./api";

export const askAiTutor = async (question) => {
    try{
        const response = await api.post("/api/ai/tutor", { question });
        return response.data;
    } catch (error) {
        console.error("Error asking AI Tutor:", error.response?.data || error.message);
        throw error.response?.data || new Error("An error occurred while asking the AI Tutor.");
    }
}
