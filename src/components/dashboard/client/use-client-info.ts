import { useState, useEffect } from "react";
import { UAParser } from "ua-parser-js";
import { ClientInfo, ExtendedPerformance, NetworkInformation } from "./types";

export function useClientInfo() {
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);

  useEffect(() => {
    const parser = new UAParser();
    const result = parser.getResult();

    const getPerformanceLoadTime = (): string => {
      const [navigation] = performance.getEntriesByType(
        "navigation"
      ) as PerformanceNavigationTiming[];
      if (navigation) {
        return `${Math.round(
          navigation.loadEventEnd - navigation.startTime
        )}ms`;
      }
      return "不可用";
    };

    const getMemoryInfo = (): string => {
      const perf = performance as ExtendedPerformance;
      if (perf.memory) {
        const { usedJSHeapSize, jsHeapSizeLimit } = perf.memory;
        return `${Math.round(usedJSHeapSize / 1048576)}MB / ${Math.round(
          jsHeapSizeLimit / 1048576
        )}MB`;
      }
      return "不可用";
    };

    const getWebGLInfo = (): { renderer: string; vendor: string } => {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension(
          "WEBGL_debug_renderer_info"
        );
        if (debugInfo) {
          const renderer =
            (gl as WebGLRenderingContext).getParameter(
              debugInfo.UNMASKED_RENDERER_WEBGL
            ) || "不可用";
          const vendor =
            (gl as WebGLRenderingContext).getParameter(
              debugInfo.UNMASKED_VENDOR_WEBGL
            ) || "不可用";
          return { renderer, vendor };
        }
      }
      return { renderer: "不可用", vendor: "不可用" };
    };

    const getFonts = (): string[] => {
      if (document.fonts) {
        const fonts: string[] = [];
        document.fonts.forEach((font) => fonts.push(font.family));
        return fonts;
      }
      return [];
    };

    const getClientInfo = async () => {
      const info: ClientInfo = {
        browser: `${result.browser.name} ${result.browser.version}`,
        os: `${result.os.name} ${result.os.version}`,
        device: result.device.type || "Desktop",
        screen: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookiesEnabled: navigator.cookieEnabled,
        doNotTrack:
          navigator.doNotTrack === "1"
            ? true
            : navigator.doNotTrack === "0"
            ? false
            : null,
        online: navigator.onLine,
        performance: {
          memory: getMemoryInfo(),
          loadTime: getPerformanceLoadTime(),
        },
        webGL: getWebGLInfo(),
        storage: {
          localStorageSize: localStorage.length,
          sessionStorageSize: sessionStorage.length,
        },
        network: {
          type: "未知",
          downlinkMax: 0,
        },
        cpu: {
          cores: navigator.hardwareConcurrency || 1,
        },
        mediaDevices: {
          audioinput: 0,
          audiooutput: 0,
        },
        fonts: getFonts(),
      };

      if (
        "connection" in navigator &&
        (navigator.connection as NetworkInformation)
      ) {
        const connection = navigator.connection as NetworkInformation;
        info.connection = {
          effectiveType: connection.effectiveType || "未知",
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
        };
        info.network = {
          type: connection.effectiveType || "未知",
          downlinkMax: connection.downlinkMax || 0,
        };
      }

      if ("geolocation" in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject)
          );
          info.geolocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch (error) {
          console.error("地理位置错误:", error);
        }
      }

      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          info.mediaDevices = {
            audioinput: devices.filter((device) => device.kind === "audioinput")
              .length,
            audiooutput: devices.filter(
              (device) => device.kind === "audiooutput"
            ).length,
          };
        } catch (error) {
          console.error("媒体设备错误:", error);
        }
      }

      setClientInfo(info);
    };

    getClientInfo();
  }, []);

  return clientInfo;
}
