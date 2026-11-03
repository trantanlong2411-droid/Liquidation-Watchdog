import test from 'node:test';
import assert from 'node:assert/strict';
import {assess,projectBorrowAssets} from '../src/engine.mjs';

test('IRM accrued-interest projection matches Morpho MathLib three-term WAD Taylor rounding',()=>{
 const W=10n**18n;
 const rate=1000000000000n; // 1e-6 / second in WAD.
 const n=3600n;
 const first=rate*n;
 const second=first*first/(2n*W);
 const third=second*first/(3n*W);
 const expectedInterest=1000000000n*(first+second+third)/W;
 const projection=projectBorrowAssets(1000000000n,rate,n);
 assert.equal(projection.interestRaw,expectedInterest.toString());
 assert.equal(projection.totalBorrowAssets,(1000000000n+expectedInterest).toString());
 assert.equal(projection.elapsedSeconds,3600);
 assert.throws(()=>projectBorrowAssets(1,-1,10),/Invalid/);
});

test('IRM projection reduces indicative health and generates a more conservative classification',()=>{
 const p={
  collateral:1200000000n,borrowShares:1000000000n,
  totalBorrowAssets:1000000000n,totalBorrowShares:1000000000n,
  price:10n**36n,lltv:860000000000000000n,
  loanDecimals:6,collateralDecimals:6,
  marketAgeSeconds:1800,
  warnWad:'1300000000000000000',critWad:'1100000000000000000'
 };
 const stored=assess(p);
 const extra=projectBorrowAssets(p.totalBorrowAssets,1000000000000n,1800);
 const accrued=assess({...p,effectiveBorrowAssets:extra.totalBorrowAssets});
 assert.equal(stored.borrowInterestSource,'STORED_MARKET');
 assert.equal(accrued.borrowInterestSource,'IRM_PROJECTED');
 assert.equal(stored.interestMayBeUnaccrued,true);
 assert.equal(accrued.interestMayBeUnaccrued,false);
 assert.ok(BigInt(accrued.debtRaw)>BigInt(stored.debtRaw));
 assert.ok(BigInt(accrued.healthFactorWad)<BigInt(stored.healthFactorWad));
 assert.equal(accrued.borrowAssetsBasisRaw,extra.totalBorrowAssets);
});

test('health factor is rounded down following Morpho maxBorrow with intermediate floors',()=>{
 const p={
  collateral:100001n,borrowShares:1010001n,
  totalBorrowAssets:999999n,totalBorrowShares:1000000n,
  price:1000000000000000000000000000000000001n,
  lltv:860000000000000000n,loanDecimals:6,collateralDecimals:6,
  marketAgeSeconds:1,
  warnWad:'1300000000000000000',critWad:'1100000000000000000'
 };
 const r=assess(p);
 const debt=BigInt(r.debtRaw),W=10n**18n;
 const maxBorrow=(p.collateral*p.price/(10n**36n))*p.lltv/W;
 assert.equal(r.healthFactorWad,(maxBorrow*W/debt).toString());
});
