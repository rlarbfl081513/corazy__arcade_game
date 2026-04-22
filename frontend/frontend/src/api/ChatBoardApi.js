import { handleApiError } from '@/utils/errorHandler';
import apiClient from './clientApi';
import { ENDPOINTS } from './endpointsApi';

/* 
 * ChatBoard API 서비스
 *  - 채팅 100개 불러오기
*/


// 최근 채팅 100개 조회
export const getChatList = async(roomId, {limit = 100} ={}) => {
    try {
        const url = ENDPOINTS.CHAT_BOARD.GET_BY_ROOMID(roomId);

        const response = await apiClient.get(url,{params:{limit}});
        return response.data;
    } catch (error) {
        const errorMessage = handleApiError(error,'채팅 조회에 실패했습니다.');
        throw new Error(errorMessage);
    }
};