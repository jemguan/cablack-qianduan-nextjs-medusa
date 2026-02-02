import type { BlockBase, BlockConfig } from './types';

export function handleCompositeContainerBlock(
  block: BlockBase,
  blockConfig: Record<string, any>
): BlockConfig | null {
  if (!blockConfig.containerMetadata) {
    console.warn(`[CompositeContainer] Block ${block.id} missing containerMetadata`);
    return null;
  }

  return {
    id: block.id,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'CompositeContainer',
    props: {},
  };
}
