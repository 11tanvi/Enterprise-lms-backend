/// <reference types="vite/client" />

// Teaches TypeScript how to import image files
declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

// Teaches TypeScript how to import CSS files
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}
