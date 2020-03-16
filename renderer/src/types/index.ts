export enum RendererKind {
  PDF,
  HTML,
}

export interface Document {
  template: string;
  data: { [key: string]: any };
  renderer: RendererKind;
  fontFace?: { [key: string]: any };
}

export interface Node {
  type: string;
  name?: string;
  voidElement?: boolean;
  attrs?: { [key: string]: any };
  children?: Array<Node>;
  content?: string;
}
