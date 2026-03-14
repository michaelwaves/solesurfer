import { createContext, useContext } from "react";

export const DialogContext = createContext(false);

export const useDialogContext = () => useContext(DialogContext);
