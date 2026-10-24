/** 按 Redis Stream 的毫秒与序号数值比较，避免字典序造成乱序。 */
export function compareStreamIds(left: string, right: string): number {
  const a = parseStreamId(left)
  const b = parseStreamId(right)
  if (a[0] !== b[0]) return a[0] < b[0] ? -1 : 1
  return a[1] === b[1] ? 0 : a[1] < b[1] ? -1 : 1
}

/** 将合法 Stream ID 变成 IndexedDB 可以按字典序排序的固定宽度键。 */
export function toEventOrderKey(id: string): string {
  const [ms, sequence] = parseStreamId(id)
  return `${ms.toString().padStart(20, '0')}-${sequence.toString().padStart(20, '0')}`
}

/** 严格校验游标，防止溢出后截断导致事件顺序错误。 */
function parseStreamId(id: string): [bigint, bigint] {
  if (!/^\d{1,20}-\d{1,20}$/.test(id)) throw new Error('INVALID_STREAM_ID')
  const [ms, sequence] = id.split('-')
  return [BigInt(ms), BigInt(sequence)]
}
