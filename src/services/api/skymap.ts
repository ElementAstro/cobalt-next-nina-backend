import { AxiosError } from "axios";
import api from "@/services/axios";
import {
  IBaseResponse,
  IDSOFramingObjectInfo,
  IObservationPlan,
  IOFRequestFOVpoints,
  IOFRequestFOVpointsTiles,
  IOFRequestLightStar,
  IOFResponseAltCurve,
  IOFResponseFindTargetName,
  IOFResponseFOVpoints,
  IOFResponseFOVpointsTiles,
  IOFResponseLightStar,
  IOFResponseOBJSimple,
  IOFResponseTwilightData,
  ITargetManagement,
  ITargetStatistics,
} from "@/types/skymap";

interface APIErrorResponse {
  message: string;
  // 其他可能的错误响应字段
}

const handleApiError = (error: AxiosError<APIErrorResponse>) => {
  if (error.response) {
    console.error("API Error:", error.response.data);
    throw new Error(error.response.data.message || "请求失败");
  }
  throw error;
};

export const getLightStars = (
  star_filter: IOFRequestLightStar
): Promise<IOFResponseLightStar> =>
  api.request<IOFResponseLightStar>({
    url: "/target_search/light_star/",
    method: "post",
    data: star_filter,
  });

export const findTargetByName = (
  to_find_name: string
): Promise<IOFResponseFindTargetName> =>
  api.request<IOFResponseFindTargetName>({
    url: "/target_search/name/",
    method: "post",
    data: { name: to_find_name },
  });

export const getFovPointsOfRect = (
  fov_request: IOFRequestFOVpoints
): Promise<IOFResponseFOVpoints> =>
  api.request<IOFResponseFOVpoints>({
    url: "/target_search/fov_points/",
    method: "post",
    data: fov_request,
  });

// this one is not available currently
export const getTileFovPointsOfRect = (
  fov_request: IOFRequestFOVpointsTiles
): Promise<IOFResponseFOVpointsTiles> =>
  api.request<IOFResponseFOVpointsTiles>({
    url: "/target_search/fov_points_tiles/",
    method: "post",
    data: fov_request,
  });

export const getTargetALtCurveOnly = (
  ra: number,
  dec: number
): Promise<IOFResponseAltCurve> =>
  api.request<IOFResponseAltCurve>({
    url: "/target_search/alt_curves/",
    method: "post",
    data: {
      ra: ra,
      dec: dec,
    },
  });

export const getTwilightData = (): Promise<IOFResponseTwilightData> =>
  api.request<IOFResponseTwilightData>({
    url: "/target_search/twilight_time/",
    method: "get",
  });

export const getSimpleCardInfo = (
  ra: number,
  dec: number
): Promise<IOFResponseOBJSimple> =>
  api.request<IOFResponseOBJSimple>({
    url: "/target_search/update_obj_simple_info/",
    method: "post",
    data: {
      ra: ra,
      dec: dec,
    },
  });

// 新增目标管理API
export const targetManagementApi: ITargetManagement = {
  async saveTarget(
    target: IDSOFramingObjectInfo
  ): Promise<IBaseResponse<boolean>> {
    try {
      const response = await api.request<IBaseResponse<boolean>>({
        url: "/target_management/save/",
        method: "post",
        data: target,
      });
      return response;
    } catch (error) {
      return handleApiError(error as AxiosError<APIErrorResponse>);
    }
  },

  async deleteTarget(targetId: string): Promise<IBaseResponse<boolean>> {
    try {
      const response = await api.request<IBaseResponse<boolean>>({
        url: `/target_management/delete/${targetId}`,
        method: "delete",
      });
      return response;
    } catch (error) {
      return handleApiError(error as AxiosError<APIErrorResponse>);
    }
  },

  async updateTarget(
    target: IDSOFramingObjectInfo
  ): Promise<IBaseResponse<boolean>> {
    try {
      const response = await api.request<IBaseResponse<boolean>>({
        url: "/target_management/update/",
        method: "put",
        data: target,
      });
      return response;
    } catch (error) {
      return handleApiError(error as AxiosError<APIErrorResponse>);
    }
  },

  async getTargetList(): Promise<IBaseResponse<IDSOFramingObjectInfo[]>> {
    try {
      const response = await api.request<
        IBaseResponse<IDSOFramingObjectInfo[]>
      >({
        url: "/target_management/list/",
        method: "get",
      });
      return response;
    } catch (error) {
      return handleApiError(error as AxiosError<APIErrorResponse>);
    }
  },
};

export const createObservationPlan = async (
  plan: IObservationPlan
): Promise<IBaseResponse<boolean>> => {
  try {
    return await api.request<IBaseResponse<boolean>>({
      url: "/observation/create_plan/",
      method: "post",
      data: plan,
    });
  } catch (error) {
    return handleApiError(error as AxiosError<APIErrorResponse>);
  }
};

export const getObservationSuggestions = async (params: {
  date: Date;
  duration: number;
  minAltitude: number;
  weather: string[];
}): Promise<IBaseResponse<IObservationPlan>> => {
  try {
    return await api.request<IBaseResponse<IObservationPlan>>({
      url: "/observation/suggestions/",
      method: "post",
      data: params,
    });
  } catch (error) {
    return handleApiError(error as AxiosError<APIErrorResponse>);
  }
};

export const getTargetStatistics = async (
  targetIds: string[]
): Promise<IBaseResponse<ITargetStatistics>> => {
  try {
    return await api.request<IBaseResponse<ITargetStatistics>>({
      url: "/target_management/statistics/",
      method: "post",
      data: { targetIds },
    });
  } catch (error) {
    return handleApiError(error as AxiosError<APIErrorResponse>);
  }
};

export const exportTargets = async (
  targetIds: string[],
  format: string
): Promise<IBaseResponse<Blob>> => {
  try {
    return await api.request<IBaseResponse<Blob>>({
      url: `/target_management/export/${format}`,
      method: "post",
      data: { targetIds },
      responseType: "blob",
    });
  } catch (error) {
    return handleApiError(error as AxiosError<APIErrorResponse>);
  }
};

export const importTargets = async (
  file: File
): Promise<IBaseResponse<IDSOFramingObjectInfo[]>> => {
  const formData = new FormData();
  formData.append("file", file);
  try {
    return await api.request<IBaseResponse<IDSOFramingObjectInfo[]>>({
      url: "/target_management/import/",
      method: "post",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  } catch (error) {
    return handleApiError(error as AxiosError<APIErrorResponse>);
  }
};
