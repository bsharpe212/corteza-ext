import path from 'path'
import { describe, it, beforeEach, afterEach } from 'mocha'
import { expect } from 'chai'
import { stub, restore } from 'sinon'
import { corredor, apiClients, compose } from '@cortezaproject/corteza-js'
import CreateNewCase from './CreateNewCase'
const { Record, getModuleFromYaml } = compose
const { ComposeHelper } = corredor
const ComposeAPI = apiClients.Compose

describe(__filename, () => {
  let h,ui
  const modulesYaml = path.join(__dirname, '../../../../', 'config', '1100_modules.yaml')
  const recordID = '1'
  
  const settingsModule = getModuleFromYaml('Settings', modulesYaml)
  const settingsRecord = new Record(settingsModule)
  settingsRecord.recordID = recordID
  settingsRecord.values = {
    CaseNextNumber: 1
  }

  const accountModule = getModuleFromYaml('Account', modulesYaml)
  const accountRecord = new Record(accountModule)
  accountRecord.recordID = recordID
  accountRecord.values = {
    OwnerId: '2',
    FirstName: 'John',
    LastName: 'Doe',
    IsPrimary: '1',
    Email: 'john.doe@mail.com',
    Phone: '123456789'
  }

  const caseModule = getModuleFromYaml('Case', modulesYaml)
  const newCaseRecord = new Record(caseModule)
  newCaseRecord.values = {
    OwnerId: accountRecord.values.OwnerId,
    Subject: '(no subject)',
    ContactId: '1',
    AccountId: recordID,
    Status: 'New',
    Priority: 'Low',
    SuppliedName: accountRecord.values.FirstName + ' ' + accountRecord.values.LastName,
    SuppliedEmail: accountRecord.values.Email,
    SuppliedPhone: accountRecord.values.Phone,
    CaseNumber: '00000001'
  }

  beforeEach(() => {
    h = stub(new ComposeHelper({ ComposeAPI: new ComposeAPI({}) }))
    ui = stub({ 
      success: () => {},
      gotoRecordEditor: () => {}
    })
  })

  afterEach(() => {
    restore()
  })

  describe('successful creation', () => {
    it('should successfully create case from an Account', async () => {
      h.findLastRecord.resolves(settingsRecord)
      h.findRecords.resolves({ set: [accountRecord] })
      h.makeRecord.resolves(newCaseRecord)
      h.saveRecord.onFirstCall().resolves(newCaseRecord)
      h.saveRecord.onSecondCall().resolves(settingsRecord)

      await CreateNewCase.exec({ $record: accountRecord }, { Compose: h, ComposeUI: ui })
      
      expect(h.findLastRecord.calledOnceWith('Settings')).true
      expect(h.findRecords.calledOnceWith(`AccountId = ${recordID}`, 'Contact')).true
      expect(h.makeRecord.calledOnceWith(newCaseRecord.values, 'Case')).true
      expect(h.saveRecord.getCall(0).calledWith(newCaseRecord)).true
      expect(h.saveRecord.getCall(1).calledWith(settingsRecord)).true
      expect(ui.success.calledOnceWith('The new case has been created.')).true
      expect(ui.gotoRecordEditor.calledOnceWith(newCaseRecord)).true
    })
  })

  describe('error handling', () => {
    it('should throw error if findLastRecord throws', async () => {
      h.findLastRecord.throws()

      expect(async () => await CreateNewCase.exec({ $record: accountRecord }, { Compose: h, ComposeUI: ui })).throws
    })

    it('should throw error if findRecords throws', async () => {
      h.findLastRecord.resolves(settingsRecord)
      h.findRecords.throws()

      expect(async () => await CreateNewCase.exec({ $record: accountRecord }, { Compose: h, ComposeUI: ui })).throws
    })

    it('should throw error if makeRecord throws', async () => {
      h.findLastRecord.resolves(settingsRecord)
      h.findRecords.resolves({ set: [accountRecord] })
      h.makeRecord.throws()

      expect(async () => await CreateNewCase.exec({ $record: accountRecord }, { Compose: h, ComposeUI: ui })).throws
    })

    it('should throw error if saveRecord 1 throws', async () => {
      h.findLastRecord.resolves(settingsRecord)
      h.findRecords.resolves({ set: [accountRecord] })
      h.makeRecord.resolves(newCaseRecord)
      h.saveRecord.onFirstCall().throws()

      expect(async () => await CreateNewCase.exec({ $record: accountRecord }, { Compose: h, ComposeUI: ui })).throws
    })

    it('should throw error if saveRecord 2 throws', async () => {
      h.findLastRecord.resolves(settingsRecord)
      h.findRecords.resolves({ set: [accountRecord] })
      h.makeRecord.resolves(newCaseRecord)
      h.saveRecord.onFirstCall().resolves(newCaseRecord)
      h.saveRecord.onSecondCall().throws()

      expect(async () => await CreateNewCase.exec({ $record: accountRecord }, { Compose: h, ComposeUI: ui })).throws
    })
  })
})
