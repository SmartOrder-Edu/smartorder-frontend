/**
 * 邮箱验证
 */
export function isEmail(email: string): boolean {
  const reg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return reg.test(email)
}

/**
 * 手机号验证（中国大陆）
 */
export function isPhoneNumber(phone: string): boolean {
  const reg = /^1[3-9]\d{9}$/
  return reg.test(phone)
}

/**
 * 身份证号验证
 */
export function isIdCard(idCard: string): boolean {
  const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return reg.test(idCard)
}

/**
 * URL 验证
 */
export function isUrl(url: string): boolean {
  const reg = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
  return reg.test(url)
}

/**
 * IPv4 验证
 */
export function isIPv4(ip: string): boolean {
  const reg = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  return reg.test(ip)
}

/**
 * 十六进制颜色验证
 */
export function isHexColor(color: string): boolean {
  const reg = /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/
  return reg.test(color)
}

/**
 * 强密码验证（至少8位，包含大小写字母和数字）
 */
export function isStrongPassword(password: string): boolean {
  const reg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
  return reg.test(password)
}
