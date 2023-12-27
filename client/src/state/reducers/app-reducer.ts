export type UploadedFile = {
  file: string;
  id: number;
  transcript: string;
  title: string;
};

export type State = {
  files: UploadedFile[];
  uploadedFile: null | UploadedFile;
  uploadLoading: boolean;
  uploadPercentage: number;
  transformLoading: boolean;
};

export type Action =
  | { type: 'UPLOAD_LOADING'; payload: boolean }
  | { type: 'SET_UPLOAD_PERCENTAGE'; payload: unknown }
  | { type: 'SET_UPLOAD_STATUS'; payload: unknown }
  | { type: 'TRANSFORM'; payload: unknown }
  | { type: 'TRANSFORM_LOADING'; payload: boolean };

export const initialState: State = {
  files: [],
  uploadedFile: null,
  uploadLoading: false,
  uploadPercentage: 0,
  transformLoading: false,
};

export const reducer = (state: State, { type, payload }: Action) => {
  switch (type) {
    case 'UPLOAD_LOADING':
      return { ...state, uploadLoading: payload };
    case 'SET_UPLOAD_PERCENTAGE':
      return { ...state, uploadPercentage: payload };
    case 'SET_UPLOAD_STATUS':
      return { ...state, uploadLoading: false, uploadedFile: payload };
    case 'TRANSFORM':
      return { ...state, uploadedFile: payload };
    case 'TRANSFORM_LOADING':
      return { ...state, transformLoading: payload };
    default:
      return state;
  }
};
