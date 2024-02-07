import { makeAutoObservable } from 'mobx'

class DataStore {
  orderData = {}

  constructor() {
    makeAutoObservable(this)
  }

  changeOrderData(data: any) {
    this.orderData = data
  }
}
export default DataStore
