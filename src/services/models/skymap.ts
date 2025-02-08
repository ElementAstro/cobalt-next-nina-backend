/* eslint-disable @typescript-eslint/no-unused-vars */
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
  
  const mockResponse = <T>(data: T): Promise<IBaseResponse<T>> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data,
        });
      }, 500);
    });
  };
  
  export const getLightStars = (
    star_filter: IOFRequestLightStar
  ): Promise<IBaseResponse<IOFResponseLightStar>> => {
    const data: IOFResponseLightStar = {
      success: true,
      data: [
        {
          name: "Mock Star",
          show_name: "Mock Star",
          ra: 0,
          dec: 0,
          Const: "Mock",
          Const_Zh: "模拟",
          magnitude: 1,
          alt: 45,
          az: 90,
          sky: "Clear",
        },
      ],
    };
    return mockResponse(data);
  };
  
  export const findTargetByName = (
    to_find_name: string
  ): Promise<IBaseResponse<IOFResponseFindTargetName>> => {
    const data: IOFResponseFindTargetName = {
      success: true,
      data: [
        {
          angular_size: 1,
          magnitude: 1,
          type: "Galaxy",
          id: "mock-id",
          name: to_find_name,
          alias: "Mock Alias",
          ra: 0,
          dec: 0,
          target_type: "Mock Type",
          const: "Mock",
          size: 1,
          transit_month: 1,
          transit_date: "2025-02-08",
          filter: "Mock Filter",
          focal_length: 1000,
          altitude: [["2025-02-08T00:00:00Z", 45, 90]],
          Top200: null,
          rotation: 0,
          flag: "Mock Flag",
          tag: "Mock Tag",
          checked: true,
        },
      ],
    };
    return mockResponse(data);
  };
  
  export const getFovPointsOfRect = (
    fov_request: IOFRequestFOVpoints
  ): Promise<IBaseResponse<IOFResponseFOVpoints>> => {
    const data: IOFResponseFOVpoints = {
      success: true,
      data: [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
    };
    return mockResponse(data);
  };
  
  export const getTileFovPointsOfRect = (
    fov_request: IOFRequestFOVpointsTiles
  ): Promise<IBaseResponse<IOFResponseFOVpointsTiles>> => {
    const data: IOFResponseFOVpointsTiles = {
      success: true,
      data: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
      ],
    };
    return mockResponse(data);
  };
  
  export const getTargetALtCurveOnly = (
    ra: number,
    dec: number
  ): Promise<IBaseResponse<IOFResponseAltCurve>> => {
    const data: IOFResponseAltCurve = {
      success: true,
      data: {
        moon_distance: 10,
        altitude: [["2025-02-08T00:00:00Z", 45, 90]],
        name: "Mock Target",
        id: "mock-id",
        ra,
        dec,
        target_type: "Mock Type",
        size: 1,
      },
    };
    return mockResponse(data);
  };
  
  export const getTwilightData = (): Promise<IBaseResponse<IOFResponseTwilightData>> => {
    const data: IOFResponseTwilightData = {
      success: true,
      data: {
        evening: {
          sun_set_time: "2025-02-08T18:00:00Z",
          evening_civil_time: "2025-02-08T18:30:00Z",
          evening_nautical_time: "2025-02-08T19:00:00Z",
          evening_astro_time: "2025-02-08T19:30:00Z",
        },
        morning: {
          sun_rise_time: "2025-02-08T06:00:00Z",
          morning_civil_time: "2025-02-08T05:30:00Z",
          morning_nautical_time: "2025-02-08T05:00:00Z",
          morning_astro_time: "2025-02-08T04:30:00Z",
        },
      },
    };
    return mockResponse(data);
  };
  
  export const getSimpleCardInfo = (
    ra: number,
    dec: number
  ): Promise<IBaseResponse<IOFResponseOBJSimple>> => {
    const data: IOFResponseOBJSimple = {
      success: true,
      data: {
        current: 1,
        highest: 1,
        available_shoot_time: 1,
        az: 90,
      },
    };
    return mockResponse(data);
  };
  
  export const targetManagementApi: ITargetManagement = {
    saveTarget(target: IDSOFramingObjectInfo): Promise<IBaseResponse<boolean>> {
      return mockResponse(true);
    },
  
    deleteTarget(targetId: string): Promise<IBaseResponse<boolean>> {
      return mockResponse(true);
    },
  
    updateTarget(target: IDSOFramingObjectInfo): Promise<IBaseResponse<boolean>> {
      return mockResponse(true);
    },
  
    getTargetList(): Promise<IBaseResponse<IDSOFramingObjectInfo[]>> {
      const data: IDSOFramingObjectInfo[] = [
        {
          name: "Mock Target",
          ra: 0,
          dec: 0,
          rotation: 0,
          flag: "Mock Flag",
          tag: "Mock Tag",
          target_type: "Mock Type",
          size: 1,
          checked: true,
        },
      ];
      return mockResponse(data);
    },
  };
  
  export const createObservationPlan = async (
    plan: IObservationPlan
  ): Promise<IBaseResponse<boolean>> => {
    return mockResponse(true);
  };
  
  export const getObservationSuggestions = async (params: {
    date: Date;
    duration: number;
    minAltitude: number;
    weather: string[];
  }): Promise<IBaseResponse<IObservationPlan>> => {
    const data: IObservationPlan = {
      startTime: new Date(),
      endTime: new Date(),
      targets: [],
      priority: 1,
      weather: "Clear",
    };
    return mockResponse(data);
  };
  
  export const getTargetStatistics = async (
    targetIds: string[]
  ): Promise<IBaseResponse<ITargetStatistics>> => {
    const data: ITargetStatistics = {
      totalCount: 1,
      typeDistribution: { "Mock Type": 1 },
      tagDistribution: { "Mock Tag": 1 },
      flagDistribution: { "Mock Flag": 1 },
      averageSize: 1,
      monthlyDistribution: { "2025-02": 1 },
    };
    return mockResponse(data);
  };
  
  export const exportTargets = async (
    targetIds: string[],
    format: string
  ): Promise<IBaseResponse<Blob>> => {
    const data = new Blob(["Mock Data"], { type: "text/plain" });
    return mockResponse(data);
  };
  
  export const importTargets = async (
    file: File
  ): Promise<IBaseResponse<IDSOFramingObjectInfo[]>> => {
    const data: IDSOFramingObjectInfo[] = [
      {
        name: "Mock Target",
        ra: 0,
        dec: 0,
        rotation: 0,
        flag: "Mock Flag",
        tag: "Mock Tag",
        target_type: "Mock Type",
        size: 1,
        checked: true,
      },
    ];
    return mockResponse(data);
  };