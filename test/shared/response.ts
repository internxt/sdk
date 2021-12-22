export function validResponse(data: object) {
  return {
    status: 200,
    data: data
  };
}

export function failedResponse(data: object, code = 500) {
  return {
    status: code,
    data: data
  };
}