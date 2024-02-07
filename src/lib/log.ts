export const topialog = (...params: any[]) => {
  if (process.env.REACT_APP_REPORT_ENV === 'dn') {
    console.log(...params)
  }
}
