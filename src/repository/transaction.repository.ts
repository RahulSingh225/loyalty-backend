export default class TransactionRepository {

    constructor(){

    }

    async getPassbook(userId:number){
console.log(userId)
        const sampleData =
        [
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-12-18T23:22:50.266Z',
    firstParty: 'Priya Garment',
    secondParty: 'Sanjay Shop',
    documentType: 'Invoice',
    entryType: 'DEBIT',
    points: 172
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-02-28T03:52:53.783Z',
    firstParty: 'Rohit Boutique',
    secondParty: 'Vikram Garment',
    documentType: 'Invoice',
    entryType: 'DEBIT',
    points: 72
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-06-27T07:31:56.785Z',
    firstParty: 'Meena Shop',
    secondParty: 'Kanchan Garment',
    documentType: 'Point Transfer',
    entryType: 'CREDIT',
    points: 618
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-02-24T09:57:41.921Z',
    firstParty: 'Kanchan Textiles',
    secondParty: 'Priya Textiles',
    documentType: 'Point Transfer',
    entryType: 'CREDIT',
    points: 360
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-10-19T22:57:47.621Z',
    firstParty: 'Amit Garment',
    secondParty: 'Rohit Textiles',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 177
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-02-27T05:30:15.025Z',
    firstParty: 'Priya Garment',
    secondParty: 'Neha Garment',
    documentType: 'Point Transfer',
    entryType: 'DEBIT',
    points: 938
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-10-02T21:49:32.355Z',
    firstParty: 'Vikram Emporium',
    secondParty: 'Sanjay Textiles',
    documentType: 'Point Transfer',
    entryType: 'CREDIT',
    points: 648
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-01-19T22:06:38.062Z',
    firstParty: 'Vikram Mart',
    secondParty: 'Rohit Garment',
    documentType: 'Invoice',
    entryType: 'DEBIT',
    points: 135
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-08-19T21:11:01.773Z',
    firstParty: 'Vikram Mart',
    secondParty: 'Amit Textiles',
    documentType: 'Point Transfer',
    entryType: 'DEBIT',
    points: 543
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-01-16T12:49:24.567Z',
    firstParty: 'Neha Boutique',
    secondParty: 'Kamal Boutique',
    documentType: 'Point Transfer',
    entryType: 'DEBIT',
    points: 765
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-09-10T06:59:13.284Z',
    firstParty: 'Anjali Mart',
    secondParty: 'Kamal Emporium',
    documentType: 'Invoice',
    entryType: 'DEBIT',
    points: 329
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-01-11T02:01:00.312Z',
    firstParty: 'Amit Textiles',
    secondParty: 'Priya Emporium',
    documentType: 'Invoice',
    entryType: 'DEBIT',
    points: 905
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-01-11T05:05:01.641Z',
    firstParty: 'Rohit Garment',
    secondParty: 'Rahul Emporium',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 363
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-03-15T14:38:56.768Z',
    firstParty: 'Neha Boutique',
    secondParty: 'Vikram Shop',
    documentType: 'Invoice',
    entryType: 'DEBIT',
    points: 368
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-09-03T05:38:04.753Z',
    firstParty: 'Vikram Store',
    secondParty: 'Kamal Mart',
    documentType: 'Claim Request',
    entryType: 'CREDIT',
    points: 690
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-02-17T22:13:55.630Z',
    firstParty: 'Meena Emporium',
    secondParty: 'Suman Textiles',
    documentType: 'Point Transfer',
    entryType: 'DEBIT',
    points: 217
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-06-05T05:05:47.964Z',
    firstParty: 'Sanjay Store',
    secondParty: 'Neha Textiles',
    documentType: 'Point Transfer',
    entryType: 'DEBIT',
    points: 845
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-03-09T07:36:31.651Z',
    firstParty: 'Suman Boutique',
    secondParty: 'Kanchan Shop',
    documentType: 'Claim Request',
    entryType: 'CREDIT',
    points: 641
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-08-02T21:44:09.359Z',
    firstParty: 'Pooja Garment',
    secondParty: 'Pooja Boutique',
    documentType: 'Point Transfer',
    entryType: 'CREDIT',
    points: 305
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-05-01T23:10:10.343Z',
    firstParty: 'Kamal Mart',
    secondParty: 'Meena Mart',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 872
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-07-22T11:51:29.308Z',
    firstParty: 'Rohit Textiles',
    secondParty: 'Priya Garment',
    documentType: 'Claim Request',
    entryType: 'DEBIT',
    points: 514
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-08-07T18:44:03.627Z',
    firstParty: 'Rahul Shop',
    secondParty: 'Kanchan Emporium',
    documentType: 'Point Transfer',
    entryType: 'DEBIT',
    points: 900
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-03-09T15:38:59.894Z',
    firstParty: 'Ravi Emporium',
    secondParty: 'Sanjay Emporium',
    documentType: 'Point Transfer',
    entryType: 'CREDIT',
    points: 444
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-09-11T03:55:25.729Z',
    firstParty: 'Amit Mart',
    secondParty: 'Neha Boutique',
    documentType: 'Point Transfer',
    entryType: 'DEBIT',
    points: 290
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-05-17T03:42:46.021Z',
    firstParty: 'Rohit Mart',
    secondParty: 'Kamal Store',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 409
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-04-12T10:19:02.754Z',
    firstParty: 'Kamal Store',
    secondParty: 'Suman Store',
    documentType: 'Claim Request',
    entryType: 'CREDIT',
    points: 283
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-09-15T14:47:41.504Z',
    firstParty: 'Arjun Garment',
    secondParty: 'Sanjay Boutique',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 831
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-03-30T12:57:50.949Z',
    firstParty: 'Sanjay Mart',
    secondParty: 'Kamal Mart',
    documentType: 'Claim Request',
    entryType: 'CREDIT',
    points: 610
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-02-16T02:45:03.539Z',
    firstParty: 'Anjali Garment',
    secondParty: 'Kavita Boutique',
    documentType: 'Point Transfer',
    entryType: 'CREDIT',
    points: 300
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-01-23T16:57:16.408Z',
    firstParty: 'Sanjay Store',
    secondParty: 'Kavita Store',
    documentType: 'Point Transfer',
    entryType: 'DEBIT',
    points: 855
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-05-10T15:35:05.260Z',
    firstParty: 'Kavita Shop',
    secondParty: 'Vikram Store',
    documentType: 'Point Transfer',
    entryType: 'DEBIT',
    points: 416
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-12-28T15:02:49.029Z',
    firstParty: 'Kavita Boutique',
    secondParty: 'Anjali Mart',
    documentType: 'Invoice',
    entryType: 'DEBIT',
    points: 977
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-11-02T21:22:03.671Z',
    firstParty: 'Priya Boutique',
    secondParty: 'Priya Store',
    documentType: 'Point Transfer',
    entryType: 'CREDIT',
    points: 404
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-09-24T05:01:48.811Z',
    firstParty: 'Meena Store',
    secondParty: 'Vikram Boutique',
    documentType: 'Point Transfer',
    entryType: 'CREDIT',
    points: 246
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-12-26T15:55:04.720Z',
    firstParty: 'Kavita Emporium',
    secondParty: 'Meena Textiles',
    documentType: 'Claim Request',
    entryType: 'CREDIT',
    points: 363
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-10-22T11:37:50.248Z',
    firstParty: 'Suman Shop',
    secondParty: 'Kavita Boutique',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 79
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-08-24T19:36:17.880Z',
    firstParty: 'Ravi Boutique',
    secondParty: 'Priya Store',
    documentType: 'Invoice',
    entryType: 'DEBIT',
    points: 387
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-11-01T22:24:33.831Z',
    firstParty: 'Rohit Emporium',
    secondParty: 'Neha Emporium',
    documentType: 'Claim Request',
    entryType: 'DEBIT',
    points: 77
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-08-24T20:55:33.094Z',
    firstParty: 'Meena Store',
    secondParty: 'Vikram Mart',
    documentType: 'Point Transfer',
    entryType: 'CREDIT',
    points: 639
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-05-23T08:26:48.891Z',
    firstParty: 'Ravi Boutique',
    secondParty: 'Amit Textiles',
    documentType: 'Point Transfer',
    entryType: 'CREDIT',
    points: 983
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-02-08T15:57:01.531Z',
    firstParty: 'Neha Store',
    secondParty: 'Anjali Textiles',
    documentType: 'Claim Request',
    entryType: 'DEBIT',
    points: 391
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-12-31T05:12:39.169Z',
    firstParty: 'Priya Shop',
    secondParty: 'Pooja Boutique',
    documentType: 'Invoice',
    entryType: 'DEBIT',
    points: 650
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-06-22T01:31:12.938Z',
    firstParty: 'Sanjay Shop',
    secondParty: 'Suman Textiles',
    documentType: 'Point Transfer',
    entryType: 'DEBIT',
    points: 151
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-08-25T18:01:31.703Z',
    firstParty: 'Neha Textiles',
    secondParty: 'Ravi Garment',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 614
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-10-10T15:51:44.174Z',
    firstParty: 'Kavita Boutique',
    secondParty: 'Amit Store',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 480
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-08-11T07:31:50.230Z',
    firstParty: 'Amit Mart',
    secondParty: 'Meena Store',
    documentType: 'Point Transfer',
    entryType: 'DEBIT',
    points: 457
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-11-05T10:57:55.462Z',
    firstParty: 'Neha Textiles',
    secondParty: 'Neha Emporium',
    documentType: 'Point Transfer',
    entryType: 'CREDIT',
    points: 379
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-02-20T17:54:19.960Z',
    firstParty: 'Anjali Boutique',
    secondParty: 'Rohit Emporium',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 903
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-06-10T20:15:27.225Z',
    firstParty: 'Pooja Boutique',
    secondParty: 'Anjali Garment',
    documentType: 'Claim Request',
    entryType: 'CREDIT',
    points: 6
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-11-05T04:23:10.832Z',
    firstParty: 'Meena Emporium',
    secondParty: 'Rohit Store',
    documentType: 'Claim Request',
    entryType: 'CREDIT',
    points: 12
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-01-26T21:15:08.911Z',
    firstParty: 'Pooja Textiles',
    secondParty: 'Neha Mart',
    documentType: 'Claim Request',
    entryType: 'CREDIT',
    points: 883
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-08-16T16:54:06.583Z',
    firstParty: 'Amit Garment',
    secondParty: 'Pooja Mart',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 602
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-12-19T15:01:29.690Z',
    firstParty: 'Kamal Shop',
    secondParty: 'Amit Garment',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 26
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-06-28T01:06:07.390Z',
    firstParty: 'Amit Textiles',
    secondParty: 'Vikram Textiles',
    documentType: 'Claim Request',
    entryType: 'DEBIT',
    points: 348
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-08-16T16:15:19.395Z',
    firstParty: 'Anjali Textiles',
    secondParty: 'Kanchan Textiles',
    documentType: 'Point Transfer',
    entryType: 'DEBIT',
    points: 62
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-10-18T01:22:11.053Z',
    firstParty: 'Kamal Mart',
    secondParty: 'Vikram Emporium',
    documentType: 'Point Transfer',
    entryType: 'CREDIT',
    points: 908
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-11-10T20:58:20.293Z',
    firstParty: 'Neha Textiles',
    secondParty: 'Rohit Textiles',
    documentType: 'Claim Request',
    entryType: 'DEBIT',
    points: 920
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-07-29T03:04:27.938Z',
    firstParty: 'Kamal Garment',
    secondParty: 'Neha Mart',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 61
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-05-19T19:21:29.305Z',
    firstParty: 'Neha Textiles',
    secondParty: 'Rohit Textiles',
    documentType: 'Point Transfer',
    entryType: 'DEBIT',
    points: 701
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-06-08T08:52:58.177Z',
    firstParty: 'Neha Garment',
    secondParty: 'Amit Boutique',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 39
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-07-02T01:44:50.179Z',
    firstParty: 'Anjali Textiles',
    secondParty: 'Meena Shop',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 158
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-10-05T02:39:38.075Z',
    firstParty: 'Ravi Emporium',
    secondParty: 'Anjali Mart',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 438
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-03-22T15:20:50.172Z',
    firstParty: 'Priya Mart',
    secondParty: 'Kanchan Garment',
    documentType: 'Claim Request',
    entryType: 'DEBIT',
    points: 611
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-01-10T19:43:53.885Z',
    firstParty: 'Rahul Emporium',
    secondParty: 'Kamal Shop',
    documentType: 'Point Transfer',
    entryType: 'CREDIT',
    points: 473
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-03-19T14:13:31.357Z',
    firstParty: 'Pooja Mart',
    secondParty: 'Kanchan Emporium',
    documentType: 'Claim Request',
    entryType: 'CREDIT',
    points: 380
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-06-28T07:08:25.315Z',
    firstParty: 'Sanjay Textiles',
    secondParty: 'Kavita Store',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 375
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-10-17T22:05:51.308Z',
    firstParty: 'Rahul Garment',
    secondParty: 'Rahul Textiles',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 243
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-08-15T15:26:56.364Z',
    firstParty: 'Kavita Store',
    secondParty: 'Kavita Mart',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 420
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-06-04T14:30:28.385Z',
    firstParty: 'Neha Store',
    secondParty: 'Kamal Mart',
    documentType: 'Invoice',
    entryType: 'DEBIT',
    points: 626
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-10-16T22:10:19.161Z',
    firstParty: 'Rohit Emporium',
    secondParty: 'Neha Mart',
    documentType: 'Invoice',
    entryType: 'DEBIT',
    points: 119
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-04-19T06:01:04.795Z',
    firstParty: 'Neha Shop',
    secondParty: 'Amit Store',
    documentType: 'Invoice',
    entryType: 'DEBIT',
    points: 772
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-01-01T23:27:45.572Z',
    firstParty: 'Ravi Boutique',
    secondParty: 'Kamal Shop',
    documentType: 'Claim Request',
    entryType: 'DEBIT',
    points: 755
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-10-28T05:19:40.465Z',
    firstParty: 'Arjun Mart',
    secondParty: 'Vikram Emporium',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 582
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-07-15T16:36:35.473Z',
    firstParty: 'Anjali Emporium',
    secondParty: 'Suman Boutique',
    documentType: 'Claim Request',
    entryType: 'CREDIT',
    points: 899
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-07-11T14:39:40.595Z',
    firstParty: 'Meena Emporium',
    secondParty: 'Kavita Boutique',
    documentType: 'Claim Request',
    entryType: 'DEBIT',
    points: 939
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-09-30T01:37:20.014Z',
    firstParty: 'Pooja Store',
    secondParty: 'Rohit Mart',
    documentType: 'Claim Request',
    entryType: 'DEBIT',
    points: 534
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-02-03T19:59:58.787Z',
    firstParty: 'Kavita Textiles',
    secondParty: 'Pooja Garment',
    documentType: 'Claim Request',
    entryType: 'DEBIT',
    points: 463
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-09-26T08:26:03.456Z',
    firstParty: 'Rahul Emporium',
    secondParty: 'Pooja Mart',
    documentType: 'Claim Request',
    entryType: 'CREDIT',
    points: 81
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-04-10T23:48:48.972Z',
    firstParty: 'Meena Mart',
    secondParty: 'Meena Garment',
    documentType: 'Invoice',
    entryType: 'DEBIT',
    points: 298
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-11-23T06:50:54.958Z',
    firstParty: 'Kamal Boutique',
    secondParty: 'Kavita Textiles',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 194
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-08-06T23:30:15.876Z',
    firstParty: 'Kamal Boutique',
    secondParty: 'Kanchan Store',
    documentType: 'Claim Request',
    entryType: 'DEBIT',
    points: 598
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-04-06T16:01:06.155Z',
    firstParty: 'Sanjay Shop',
    secondParty: 'Anjali Shop',
    documentType: 'Claim Request',
    entryType: 'CREDIT',
    points: 811
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-06-13T18:26:32.066Z',
    firstParty: 'Meena Textiles',
    secondParty: 'Anjali Mart',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 780
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-06-06T10:17:57.016Z',
    firstParty: 'Arjun Textiles',
    secondParty: 'Arjun Emporium',
    documentType: 'Invoice',
    entryType: 'DEBIT',
    points: 916
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-10-20T03:55:02.350Z',
    firstParty: 'Amit Shop',
    secondParty: 'Suman Boutique',
    documentType: 'Point Transfer',
    entryType: 'DEBIT',
    points: 836
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-03-18T13:53:19.222Z',
    firstParty: 'Rohit Shop',
    secondParty: 'Kamal Store',
    documentType: 'Invoice',
    entryType: 'DEBIT',
    points: 453
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-05-04T19:26:46.494Z',
    firstParty: 'Arjun Shop',
    secondParty: 'Suman Textiles',
    documentType: 'Invoice',
    entryType: 'DEBIT',
    points: 58
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-11-03T06:52:18.744Z',
    firstParty: 'Amit Store',
    secondParty: 'Arjun Emporium',
    documentType: 'Invoice',
    entryType: 'DEBIT',
    points: 948
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-08-13T12:50:23.553Z',
    firstParty: 'Vikram Store',
    secondParty: 'Priya Garment',
    documentType: 'Claim Request',
    entryType: 'DEBIT',
    points: 997
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-12-22T01:34:59.453Z',
    firstParty: 'Suman Boutique',
    secondParty: 'Ravi Shop',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 648
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-06-09T07:56:38.574Z',
    firstParty: 'Amit Boutique',
    secondParty: 'Arjun Emporium',
    documentType: 'Claim Request',
    entryType: 'DEBIT',
    points: 844
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-10-08T02:25:39.374Z',
    firstParty: 'Arjun Store',
    secondParty: 'Rahul Store',
    documentType: 'Point Transfer',
    entryType: 'DEBIT',
    points: 58
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-10-31T04:48:57.835Z',
    firstParty: 'Anjali Store',
    secondParty: 'Meena Store',
    documentType: 'Point Transfer',
    entryType: 'CREDIT',
    points: 451
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-11-30T23:13:18.074Z',
    firstParty: 'Arjun Mart',
    secondParty: 'Vikram Shop',
    documentType: 'Point Transfer',
    entryType: 'DEBIT',
    points: 48
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-01-27T07:02:44.206Z',
    firstParty: 'Kamal Mart',
    secondParty: 'Kavita Textiles',
    documentType: 'Point Transfer',
    entryType: 'DEBIT',
    points: 396
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-01-28T17:45:07.041Z',
    firstParty: 'Sanjay Boutique',
    secondParty: 'Sanjay Textiles',
    documentType: 'Point Transfer',
    entryType: 'CREDIT',
    points: 785
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-04-06T04:06:06.894Z',
    firstParty: 'Rahul Garment',
    secondParty: 'Neha Garment',
    documentType: 'Invoice',
    entryType: 'DEBIT',
    points: 316
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-03-17T14:19:45.101Z',
    firstParty: 'Kamal Emporium',
    secondParty: 'Anjali Boutique',
    documentType: 'Invoice',
    entryType: 'DEBIT',
    points: 216
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2024-10-03T17:00:13.475Z',
    firstParty: 'Arjun Store',
    secondParty: 'Pooja Textiles',
    documentType: 'Invoice',
    entryType: 'CREDIT',
    points: 409
  },
  {
    userType: 'retailer',
    status: 'completed',
    processedAt: '2025-06-24T06:22:23.237Z',
    firstParty: 'Sanjay Shop',
    secondParty: 'Anjali Shop',
    documentType: 'Claim Request',
    entryType: 'CREDIT',
    points: 863
  }
]



            return sampleData

        
    }

}