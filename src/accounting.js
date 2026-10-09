function costSummary(rows,refunds){
  const gross=rows.reduce((sum,row)=>sum+Number(row.cents||0),0);
  const reimbursed=refunds.reduce((sum,row)=>sum+Number(row.amount_cents||0),0);
  return {gross,reimbursed,net:gross-reimbursed};
}
