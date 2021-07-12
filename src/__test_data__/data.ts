export const tdFioAccountId = '2901234567';
export const tdFioIBAN = 'CZ812010000000' + tdFioAccountId;
export const tdFakeUser1Name = 'Novák Jiří,Ing.';
export const tdFakeUser2Name = 'Martina Bronzová';
export const tdFakeUser3Name = 'Kovář Marek';
export const tdFakeUser4Name = 'Honza co plati okamzite';

export const tdJsonDay0 = JSON.stringify({
  accountStatement: {
    info: {
      accountId: tdFioAccountId,
      bankId: '2010',
      currency: 'CZK',
      iban: tdFioIBAN,
      bic: 'FIOBCZPPXXX',
      openingBalance: 1674819.38,
      closingBalance: 1690219.38,
      dateStart: '2019-01-31+0100',
      dateEnd: '2019-01-31+0100',
      yearList: null,
      idList: null,
      idFrom: 18247244228,
      idTo: 18247668131,
      idLastDownload: null,
    },
    transactionList: {
      transaction: [],
    },
  },
});

export const tdJsonDay1 = JSON.stringify({
  accountStatement: {
    info: {
      accountId: tdFioAccountId,
      bankId: '2010',
      currency: 'CZK',
      iban: tdFioIBAN,
      bic: 'FIOBCZPPXXX',
      openingBalance: 749215.21,
      closingBalance: 769248.21,
      dateStart: '2019-07-08+0200',
      dateEnd: '2019-07-09+0200',
      yearList: null,
      idList: null,
      idFrom: 21369401836,
      idTo: 21369426788,
      idLastDownload: 21369372513,
    },
    transactionList: {
      transaction: [
        {
          column22: {
            value: 21369401836,
            name: 'ID pohybu',
            id: 22,
          },
          column0: {
            value: '2019-07-08+0200',
            name: 'Datum',
            id: 0,
          },
          column1: {
            value: 1480.0,
            name: 'Objem',
            id: 1,
          },
          column14: {
            value: 'CZK',
            name: 'Měna',
            id: 14,
          },
          column2: {
            value: '510169113',
            name: 'Protiúčet',
            id: 2,
          },
          column10: {
            value: tdFakeUser1Name,
            name: 'Název protiúčtu',
            id: 10,
          },
          column3: {
            value: '0800',
            name: 'Kód banky',
            id: 3,
          },
          column12: {
            value: 'Česká spořitelna, a.s.',
            name: 'Název banky',
            id: 12,
          },
          column4: {
            value: '0000',
            name: 'KS',
            id: 4,
          },
          column5: {
            value: '19013617',
            name: 'VS',
            id: 5,
          },
          column6: null,
          column7: {
            value: tdFakeUser1Name,
            name: 'Uživatelská identifikace',
            id: 7,
          },
          column16: {
            value: 'Základní středoškolské taneční, kurz 8,' + tdFakeUser1Name,
            name: 'Zpráva pro příjemce',
            id: 16,
          },
          column8: {
            value: 'Bezhotovostní příjem',
            name: 'Typ',
            id: 8,
          },
          column9: null,
          column18: null,
          column25: {
            value: tdFakeUser1Name,
            name: 'Komentář',
            id: 25,
          },
          column26: null,
          column17: {
            value: 25021120055,
            name: 'ID pokynu',
            id: 17,
          },
        },
        {
          column22: {
            value: 21369426734,
            name: 'ID pohybu',
            id: 22,
          },
          column0: {
            value: '2019-07-08+0200',
            name: 'Datum',
            id: 0,
          },
          column1: {
            value: 1480.0,
            name: 'Objem',
            id: 1,
          },
          column14: {
            value: 'CZK',
            name: 'Měna',
            id: 14,
          },
          column2: {
            value: '1608815018',
            name: 'Protiúčet',
            id: 2,
          },
          column10: {
            value: tdFakeUser2Name,
            name: 'Název protiúčtu',
            id: 10,
          },
          column3: {
            value: '3030',
            name: 'Kód banky',
            id: 3,
          },
          column12: {
            value: 'Air Bank a.s.',
            name: 'Název banky',
            id: 12,
          },
          column4: null,
          column5: {
            value: '19015346',
            name: 'VS',
            id: 5,
          },
          column6: null,
          column7: {
            value: tdFakeUser2Name,
            name: 'Uživatelská identifikace',
            id: 7,
          },
          column16: {
            value: 'taneční ' + tdFakeUser2Name,
            name: 'Zpráva pro příjemce',
            id: 16,
          },
          column8: {
            value: 'Bezhotovostní příjem',
            name: 'Typ',
            id: 8,
          },
          column9: null,
          column18: null,
          column25: {
            value: tdFakeUser2Name,
            name: 'Komentář',
            id: 25,
          },
          column26: null,
          column17: {
            value: 25021190434,
            name: 'ID pokynu',
            id: 17,
          },
        },
        {
          column22: {
            value: 21369426788,
            name: 'ID pohybu',
            id: 22,
          },
          column0: {
            value: '2019-07-08+0200',
            name: 'Datum',
            id: 0,
          },
          column1: {
            value: 3400.0,
            name: 'Objem',
            id: 1,
          },
          column14: {
            value: 'CZK',
            name: 'Měna',
            id: 14,
          },
          column2: {
            value: '613989173',
            name: 'Protiúčet',
            id: 2,
          },
          column10: {
            value: tdFakeUser3Name,
            name: 'Název protiúčtu',
            id: 10,
          },
          column3: {
            value: '0800',
            name: 'Kód banky',
            id: 3,
          },
          column12: {
            value: 'Česká spořitelna, a.s.',
            name: 'Název banky',
            id: 12,
          },
          column4: {
            value: '0000',
            name: 'KS',
            id: 4,
          },
          column5: {
            value: '99038366',
            name: 'VS',
            id: 5,
          },
          column6: null,
          column7: {
            value: tdFakeUser3Name,
            name: 'Uživatelská identifikace',
            id: 7,
          },
          column16: {
            value: 'D101',
            name: 'Zpráva pro příjemce',
            id: 16,
          },
          column8: {
            value: 'Bezhotovostní příjem',
            name: 'Typ',
            id: 8,
          },
          column9: null,
          column18: null,
          column25: {
            value: tdFakeUser3Name,
            name: 'Komentář',
            id: 25,
          },
          column26: null,
          column17: {
            value: 25021190533,
            name: 'ID pokynu',
            id: 17,
          },
        },
      ],
    },
  },
});

export const tdJsonDayEmpty = JSON.stringify({
  accountStatement: {
    info: {
      accountId: tdFioAccountId,
      bankId: '2010',
      currency: 'CZK',
      iban: tdFioIBAN,
      bic: 'FIOBCZPPXXX',
      openingBalance: 714717.21,
      closingBalance: 714717.21,
      dateStart: '2019-07-10+0200',
      dateEnd: '2019-07-10+0200',
      yearList: null,
      idList: null,
      idFrom: null,
      idTo: null,
      idLastDownload: 21369426788,
    },
    transactionList: {
      transaction: [],
    },
  },
});

export const tdJsonTrTypes = JSON.stringify({
  accountStatement: {
    info: {
      accountId: tdFioAccountId,
      bankId: '2010',
      currency: 'CZK',
      iban: tdFioIBAN,
      bic: 'FIOBCZPPXXX',
      openingBalance: 1674819.38,
      closingBalance: 1690219.38,
      dateStart: '2019-01-31+0100',
      dateEnd: '2019-01-31+0100',
      yearList: null,
      idList: null,
      idFrom: 18247244228,
      idTo: 18247668131,
      idLastDownload: null,
    },
    transactionList: {
      transaction: [
        {
          column22: {
            value: 21369426788,
            name: 'ID pohybu',
            id: 22,
          },
          column0: {
            value: '2019-07-08+0200',
            name: 'Datum',
            id: 0,
          },
          column1: {
            value: 3400.0,
            name: 'Objem',
            id: 1,
          },
          column14: {
            value: 'CZK',
            name: 'Měna',
            id: 14,
          },
          column2: {
            value: '613989173',
            name: 'Protiúčet',
            id: 2,
          },
          column10: {
            value: tdFakeUser3Name,
            name: 'Název protiúčtu',
            id: 10,
          },
          column3: {
            value: '0800',
            name: 'Kód banky',
            id: 3,
          },
          column12: {
            value: 'Česká spořitelna, a.s.',
            name: 'Název banky',
            id: 12,
          },
          column4: {
            value: '0000',
            name: 'KS',
            id: 4,
          },
          column5: {
            value: '99038366',
            name: 'VS',
            id: 5,
          },
          column6: null,
          column7: {
            value: tdFakeUser3Name,
            name: 'Uživatelská identifikace',
            id: 7,
          },
          column16: {
            value: 'D101',
            name: 'Zpráva pro příjemce',
            id: 16,
          },
          column8: {
            value: 'Bezhotovostní příjem',
            name: 'Typ',
            id: 8,
          },
          column9: null,
          column18: null,
          column25: {
            value: tdFakeUser3Name,
            name: 'Komentář',
            id: 25,
          },
          column26: null,
          column17: {
            value: 25021190533,
            name: 'ID pokynu',
            id: 17,
          },
        },
      ],
    },
  },
});

export const tdJsonTrTypesFast = JSON.stringify({
  accountStatement: {
    info: {
      accountId: tdFioAccountId,
      bankId: '2010',
      currency: 'CZK',
      iban: tdFioIBAN,
      bic: 'FIOBCZPPXXX',
      openingBalance: 1674819.38,
      closingBalance: 1690219.38,
      dateStart: '2019-01-31+0100',
      dateEnd: '2019-01-31+0100',
      yearList: null,
      idList: null,
      idFrom: 18247244228,
      idTo: 18247668131,
      idLastDownload: null,
    },
    transactionList: {
      transaction: [
        {
          column22: { value: 23791824250, name: 'ID pohybu', id: 22 },
          column0: { value: '2021-06-22+0200', name: 'Datum', id: 0 },
          column1: { value: 500, name: 'Objem', id: 1 },
          column14: { value: 'CZK', name: 'Měna', id: 14 },
          column2: { value: '206577868', name: 'Protiúčet', id: 2 },
          column10: { value: tdFakeUser4Name, name: 'Název protiúčtu', id: 10 },
          column3: { value: '0600', name: 'Kód banky', id: 3 },
          column12: { value: 'MONETA Money Bank, a.s.', name: 'Název banky', id: 12 },
          column4: null,
          column5: { value: '11108104', name: 'VS', id: 5 },
          column6: null,
          column7: { value: tdFakeUser4Name, name: 'Uživatelská identifikace', id: 7 },
          column16: { value: 'bla bla', name: 'Zpráva pro příjemce', id: 16 },
          column8: { value: 'Okamžitá příchozí platba', name: 'Typ', id: 8 },
          column9: null,
          column18: null,
          column25: { value: tdFakeUser3Name, name: 'Komentář', id: 25 },
          column26: null,
          column17: { value: 29285860275, name: 'ID pokynu', id: 17 },
          column27: null,
        },
      ],
    },
  },
});

export const tdJsonTrTypesNull = JSON.stringify({
  accountStatement: {
    info: {
      accountId: tdFioAccountId,
      bankId: '2010',
      currency: 'CZK',
      iban: tdFioIBAN,
      bic: 'FIOBCZPPXXX',
      openingBalance: 1674819.38,
      closingBalance: 1690219.38,
      dateStart: '2019-01-31+0100',
      dateEnd: '2019-01-31+0100',
      yearList: null,
      idList: null,
      idFrom: 18247244228,
      idTo: 18247668131,
      idLastDownload: null,
    },
    transactionList: {
      transaction: [
        {
          column22: {
            value: 21369426788,
            name: 'ID pohybu',
            id: 22,
          },
          column0: {
            value: '2019-07-08+0200',
            name: 'Datum',
            id: 0,
          },
          column1: {
            value: 3400.0,
            name: 'Objem',
            id: 1,
          },
          column14: {
            value: 'CZK',
            name: 'Měna',
            id: 14,
          },
          column2: {
            value: '613989173',
            name: 'Protiúčet',
            id: 2,
          },
          column10: {
            value: tdFakeUser3Name,
            name: 'Název protiúčtu',
            id: 10,
          },
          column3: {
            value: '0800',
            name: 'Kód banky',
            id: 3,
          },
          column12: {
            value: 'Česká spořitelna, a.s.',
            name: 'Název banky',
            id: 12,
          },
          column4: {
            value: '0000',
            name: 'KS',
            id: 4,
          },
          column5: {
            value: '99038366',
            name: 'VS',
            id: 5,
          },
          column6: null,
          column7: {
            value: tdFakeUser3Name,
            name: 'Uživatelská identifikace',
            id: 7,
          },
          column16: {
            value: 'D101',
            name: 'Zpráva pro příjemce',
            id: 16,
          },
          column9: null,
          column18: null,
          column25: {
            value: tdFakeUser3Name,
            name: 'Komentář',
            id: 25,
          },
          column26: null,
          column17: {
            value: 25021190533,
            name: 'ID pokynu',
            id: 17,
          },
        },
      ],
    },
  },
});
