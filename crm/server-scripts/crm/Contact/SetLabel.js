export default {
  label: 'Set label for Contact',
  description: 'Set label for contact record',

  * triggers ({ before }) {
    yield before('create', 'update')
      .for('compose:record')
      .where('module', 'Contact')
      .where('namespace', 'crm')
  },

  async exec ({ $record }, { Compose }) {
    // Set the record label string
    let recordLabel = ''

    // Get the first name
    let firstName = $record.values.FirstName || ''

    // Get the last name
    let lastName = $record.values.LastName || ''

    // Create the full name
    if (firstName && lastName) {
      recordLabel = firstName + ' ' + lastName
    }

    else if (firstName) {
      recordLabel = firstName
    }

    else if (lastName) {
      recordLabel = lastName
    }


    // Get the company name from the account
    // Check if there is a related account, to map the fields of the account
    const accountId = $record.values.AccountId
    if (accountId) {
      return Compose.findRecordByID(accountId, 'Account').then(accountRecord => {
        if ((accountRecord || { values: {}}).values.AccountName) {
          // Add to the record label
          recordLabel = recordLabel + ` (${accountRecord.values.AccountName})`
        }
        $record.values.RecordLabel = recordLabel
        return $record
      })
    }
  }
}
