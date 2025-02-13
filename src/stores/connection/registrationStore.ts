import { create } from "zustand";
import CryptoJS from "crypto-js";
import Cookies from "js-cookie";
import { z } from "zod";
import logger from "@/utils/logger";

const RegistrationDataSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

interface RegistrationData {
  username: string;
  password: string;
}

interface RegistrationState {
  isRegistered: boolean;
  registrationData: RegistrationData;
  registerUser: (data: RegistrationData) => void;
  loadRegistration: () => void;
  saveRegistration: () => void;
  update: (
    data: Partial<
      Omit<
        RegistrationState,
        "update" | "registerUser" | "loadRegistration" | "saveRegistration"
      >
    >
  ) => void;
}

const SECRET_KEY = "cobalt";

export const useRegistrationStore = create<RegistrationState>((set) => ({
  isRegistered: false,
  registrationData: {
    username: "",
    password: "",
  },

  registerUser: (data) => {
    try {
      RegistrationDataSchema.parse(data);
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        SECRET_KEY
      ).toString();

      Cookies.set("registrationData", encrypted, {
        secure: true,
        sameSite: "strict",
      });
      set({ isRegistered: true, registrationData: data });
      logger.info("User registered successfully:", data);
    } catch (error) {
      logger.error("Invalid registration data:", error);
    }
  },

  loadRegistration: () => {
    const registrationData = Cookies.get("registrationData");
    if (registrationData) {
      try {
        const decrypted = CryptoJS.AES.decrypt(
          registrationData,
          SECRET_KEY
        ).toString(CryptoJS.enc.Utf8);

        if (decrypted) {
          const data: RegistrationData = RegistrationDataSchema.parse(
            JSON.parse(decrypted)
          );
          set({ isRegistered: true, registrationData: data });
          logger.info("Loaded registration data from cookies:", data);
        }
      } catch (error) {
        logger.error("Failed to decrypt or validate registration data:", error);
      }
    }
  },

  saveRegistration: () => {
    const { registrationData } = useRegistrationStore.getState();
    try {
      RegistrationDataSchema.parse(registrationData);
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(registrationData),
        SECRET_KEY
      ).toString();

      Cookies.set("registrationData", encrypted, {
        secure: true,
        sameSite: "strict",
      });
      logger.info("Saved registration data to cookies.");
    } catch (error) {
      logger.error("Invalid registration data during save:", error);
    }
  },

  update: (data) => set((state) => ({ ...state, ...data })),
}));
