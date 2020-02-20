import path from 'path'
import { describe, it, beforeEach, afterEach } from 'mocha'
import { expect } from 'chai'
import { stub, restore } from 'sinon'
import { corredor, apiClients, compose } from '@cortezaproject/corteza-js'
import SendToPriContact from './SendToPriContact'
const { Record, getModuleFromYaml } = compose
const { ComposeHelper } = corredor
const ComposeAPI = apiClients.Compose

describe(__filename, () => {
  let h,ui
  const modulesYaml = path.join(__dirname, '../../../../', 'config', '1100_modules.yaml')
  const recordID = '1'

  const quoteModule = getModuleFromYaml('Quote', modulesYaml)
  const quoteRecord = new Record(quoteModule)
  quoteRecord.recordID = recordID
  quoteRecord.values = {
    Email: 'john.doe@mail.com'
  }

  const lineitemModule = getModuleFromYaml('QuoteLineItem', modulesYaml)
  const lineitemRecord = new Record(lineitemModule)
  lineitemRecord.recordID = recordID
  lineitemRecord.values = {
    ProductId: '1',
    Quantity: 1,
    Discount: 0,
    UnitPrice: 1,
    Subtotal: 1,
    TotalPrice: 1
  }

  beforeEach(() => {
    h = stub(new ComposeHelper({ ComposeAPI: new ComposeAPI({}) }))
    ui = stub({ 
      success: () => {},
      warning: () => {},
    })
  })

  afterEach(() => {
    restore()
  })

  describe('successful custom email', () => {
    it('should successfully send custom email', async () => {
      h.findRecords.onCall(0).resolves({ set: [lineitemRecord] })

      await SendToPriContact.exec({ $record: quoteRecord }, { Compose: h, ComposeUI: ui })

      expect(h.findRecords.calledOnceWith(`QuoteId = ${quoteRecord.recordID}`, 'QuoteLineItem')).true
      expect(h.sendMail.called).true
    })
  })

  describe('error handling', () => {
    it('should throw error if findRecords throws', async () => {
      h.findLastRecord.throws()

      expect(async () => await SendToPriContact.exec({ $record: quoteRecord }, { Compose: h, ComposeUI: ui })).throws
    })

    it('should throw error if sendMail throws', async () => {
      h.findRecords.onCall(0).resolves({ set: [lineitemRecord] })
      h.sendMail.throws()

      expect(async () => await SendToPriContact.exec({ $record: quoteRecord }, { Compose: h, ComposeUI: ui })).throws
    })
  })
})
