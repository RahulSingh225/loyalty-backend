// Interfaces for Header and Line
interface Header {
  Header: true;
  DocumentNo: string;
  EntryType: 'Points Transfer' | 'Points Claim';
  CustomerNo: string;
  OrderDate: string;
  Remarks: string;
  CreatedBy: string;
  CreatedDateTime: string;
  AgentCode: string;
  SalesPersonCode: string;
  CreatedDate: string;
  RetailerNo: string;
  Scheme: string;
  NotifyCustomer: string;
  InvoiceNo: string;
  TotalAvailablePoints: number;
  TotalTransferredPoints: number;
  Quality: string;
  QualityDesc: string;
  Quantity: string;
}

interface Line {
  Header: false;
  DocumentNo: string;
  EntryType: 'Points Transfer' | 'Points Claim';
  CustomerNo: string;
  OrderDate: string;
  Remarks: string;
  CreatedBy: string;
  CreatedDateTime: string;
  AgentCode: string;
  SalesPersonCode: string;
  CreatedDate: string;
  RetailerNo: string;
  Scheme: string;
  NotifyCustomer: string;
  InvoiceNo: string;
  TotalAvailablePoints: number;
  TotalTransferredPoints: number;
  Quality: string;
  QualityDesc: string;
  Quantity: number;
}

interface PointsTransactionData {
  Header: Partial<Header>;
  Lines: Partial<Line>[];
}

// Class to manage points transactions
class PointsTransaction {
  private header: Header;
  private lines: Line[];

  constructor(data: Partial<PointsTransactionData>) {
    // Initialize Header with defaults
    this.header = {
      Header: true,
      DocumentNo: data.Header?.DocumentNo ?? `DOC-${Date.now()}`,
      EntryType: data.Header?.EntryType ?? 'Points Transfer',
      CustomerNo: data.Header?.CustomerNo ?? '',
      OrderDate: data.Header?.OrderDate ?? new Date().toISOString().split('T')[0],
      Remarks: data.Header?.Remarks ?? '',
      CreatedBy: data.Header?.CreatedBy ?? 'System',
      CreatedDateTime: new Date().toISOString(),
      AgentCode: data.Header?.AgentCode ?? '',
      SalesPersonCode: data.Header?.SalesPersonCode ?? '',
      CreatedDate: new Date().toISOString().split('T')[0],
      RetailerNo: data.Header?.RetailerNo ?? '',
      Scheme: data.Header?.Scheme ?? '',
      NotifyCustomer: data.Header?.NotifyCustomer ?? '',
      InvoiceNo: data.Header?.InvoiceNo ?? '',
      TotalAvailablePoints: data.Header?.TotalAvailablePoints ?? 0,
      TotalTransferredPoints: data.Header?.TotalTransferredPoints ?? 0,
      Quality: '',
      QualityDesc: '',
      Quantity: ''
    };

    // Validate Header
    this.validateHeader();

    // Initialize Lines
    this.lines = (data.Lines ?? []).map((line, index) => ({
      Header: false,
      DocumentNo: this.header.DocumentNo,
      EntryType: this.header.EntryType,
      CustomerNo: this.header.CustomerNo,
      OrderDate: this.header.OrderDate,
      Remarks: this.header.Remarks,
      CreatedBy: this.header.CreatedBy,
      CreatedDateTime: this.header.CreatedDateTime,
      AgentCode: this.header.AgentCode,
      SalesPersonCode: this.header.SalesPersonCode,
      CreatedDate: this.header.CreatedDate,
      RetailerNo: this.header.RetailerNo,
      Scheme: this.header.Scheme,
      NotifyCustomer: this.header.NotifyCustomer,
      InvoiceNo: this.header.InvoiceNo,
      TotalAvailablePoints: this.header.TotalAvailablePoints,
      TotalTransferredPoints: this.header.TotalTransferredPoints,
      Quality: line.Quality ?? `QUALITY-${index + 1}`,
      QualityDesc: line.QualityDesc ?? `ARTICLE-${index + 1}`,
      Quantity: line.Quantity ?? 0
    }));

    // Validate Lines
    this.validateLines();
  }

  private validateHeader(): void {
    if (!['Points Transfer', 'Points Claim'].includes(this.header.EntryType)) {
      throw new Error("Invalid EntryType in Header. Must be 'Points Transfer' or 'Points Claim'.");
    }
    if (typeof this.header.TotalAvailablePoints !== 'number' || this.header.TotalAvailablePoints < 0) {
      throw new Error('TotalAvailablePoints in Header must be a non-negative number.');
    }
    if (typeof this.header.TotalTransferredPoints !== 'number' || this.header.TotalTransferredPoints < 0) {
      throw new Error('TotalTransferredPoints in Header must be a non-negative number.');
    }
  }

  private validateLines(): void {
    this.lines.forEach((line, index) => {
      if (typeof line.Quantity !== 'number' || line.Quantity < 0) {
        throw new Error(`Quantity in Line ${index + 1} must be a non-negative number.`);
      }
      if (!line.Quality || !line.QualityDesc) {
        throw new Error(`Quality and QualityDesc in Line ${index + 1} must be provided.`);
      }
    });

    const totalLineQuantity = this.lines.reduce((sum, line) => sum + line.Quantity, 0);
    if (totalLineQuantity > this.header.TotalTransferredPoints) {
      throw new Error('Total Quantity in Lines cannot exceed TotalTransferredPoints in Header.');
    }
  }

  // Getter for the full transaction
  public getTransaction(): { Header: Header; Lines: Line[] } {
    return {
      Header: this.header,
      Lines: this.lines
    };
  }
}

// Example usage
try {
  const transaction = new PointsTransaction({
    Header: {
      EntryType: 'Points Claim',
      CustomerNo: 'CUST123',
      OrderDate: '2025-07-05',
      Remarks: 'Claimed via retailer',
      CreatedBy: 'RetailerXYZ',
      AgentCode: 'AGENT001',
      SalesPersonCode: 'SP001',
      RetailerNo: 'RET123',
      Scheme: 'SUMMER2025',
      NotifyCustomer: 'NOTIFY001',
      InvoiceNo: 'INV456',
      TotalAvailablePoints: 1000,
      TotalTransferredPoints: 500
    },
    Lines: [
      { Quality: 'Q1', QualityDesc: 'Article A', Quantity: 200 },
      { Quality: 'Q2', QualityDesc: 'Article B', Quantity: 300 }
    ]
  });

  console.log('Points Transaction:', JSON.stringify(transaction.getTransaction(), null, 2));
} catch (error) {
  console.error('Error creating transaction:', error.message);
}