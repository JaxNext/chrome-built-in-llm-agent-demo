interface LanguageModelToolSuccessInit {
  name: string
  callId?: string
  callID?: string
  result: Array<{ type: "object"; value: unknown }>
}

declare class LanguageModelToolSuccess {
  constructor(init: LanguageModelToolSuccessInit)
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, unknown>;
  export default component;
}
