const {genKey} = require('./crypto'), Wallet = require('./wallet'), UTPool = require('./utpool'), Blockchain = require('./blockchain'), SHA256 = require('crypto-js/sha256');
// const PUB = JSON.parse(`{"n":{"0":49615175,"1":4002665,"2":14229716,"3":17403605,"4":7820534,"5":10206052,"6":39394035,"7":62883819,"8":66399985,"9":20841206,"10":24843238,"11":64988389,"12":59767205,"13":59768518,"14":46165505,"15":59528967,"16":13972572,"17":55550850,"18":21901393,"19":25305773,"20":57714096,"21":12011097,"22":39416803,"23":48431798,"24":63309076,"25":58673829,"26":20038156,"27":38181291,"28":45100959,"29":45345434,"30":21045379,"31":11277192,"32":30539097,"33":33688618,"34":41537986,"35":24538447,"36":63120802,"37":57170406,"38":12573063,"39":23678068,"40":40029426,"41":38940779,"42":20652138,"43":66869173,"44":53693449,"45":16074049,"46":22111328,"47":36067827,"48":59844048,"49":11269311,"50":65874095,"51":11588752,"52":60475826,"53":27682410,"54":47455009,"55":19124093,"56":19231543,"57":29586344,"58":8604360,"59":13375201,"60":24751300,"61":48332095,"62":52806238,"63":54332619,"64":55131245,"65":42205861,"66":59383314,"67":40991885,"68":54061580,"69":57179340,"70":6686612,"71":11497334,"72":11617828,"73":47734804,"74":24090889,"75":50238741,"76":3297666,"77":42603176,"78":382930,"t":79,"s":0},"e":65537,"d":null,"p":null,"q":null,"dmp1":null,"dmq1":null,"coeff":null,"isPublic":true,"isPrivate":false}`),
//   PRV = JSON.parse(`{"n":{"0":49615175,"1":4002665,"2":14229716,"3":17403605,"4":7820534,"5":10206052,"6":39394035,"7":62883819,"8":66399985,"9":20841206,"10":24843238,"11":64988389,"12":59767205,"13":59768518,"14":46165505,"15":59528967,"16":13972572,"17":55550850,"18":21901393,"19":25305773,"20":57714096,"21":12011097,"22":39416803,"23":48431798,"24":63309076,"25":58673829,"26":20038156,"27":38181291,"28":45100959,"29":45345434,"30":21045379,"31":11277192,"32":30539097,"33":33688618,"34":41537986,"35":24538447,"36":63120802,"37":57170406,"38":12573063,"39":23678068,"40":40029426,"41":38940779,"42":20652138,"43":66869173,"44":53693449,"45":16074049,"46":22111328,"47":36067827,"48":59844048,"49":11269311,"50":65874095,"51":11588752,"52":60475826,"53":27682410,"54":47455009,"55":19124093,"56":19231543,"57":29586344,"58":8604360,"59":13375201,"60":24751300,"61":48332095,"62":52806238,"63":54332619,"64":55131245,"65":42205861,"66":59383314,"67":40991885,"68":54061580,"69":57179340,"70":6686612,"71":11497334,"72":11617828,"73":47734804,"74":24090889,"75":50238741,"76":3297666,"77":42603176,"78":382930,"79":0,"t":79,"s":0},"e":65537,"d":{"0":49331105,"1":47201445,"2":48881085,"3":41373939,"4":18404643,"5":32841273,"6":58733959,"7":60255691,"8":37502899,"9":20479574,"10":9967586,"11":57587118,"12":1189631,"13":31249184,"14":33195190,"15":11695406,"16":59998249,"17":12429317,"18":55609852,"19":64630756,"20":5996934,"21":53685707,"22":55010450,"23":58919015,"24":32939863,"25":5601885,"26":62981666,"27":32440467,"28":45127924,"29":30191537,"30":16164782,"31":53854889,"32":25119678,"33":45556010,"34":19958071,"35":27392807,"36":24451152,"37":13025234,"38":48588914,"39":3041569,"40":37242218,"41":33505776,"42":8793896,"43":46772838,"44":21965179,"45":56568367,"46":55444729,"47":45181221,"48":58422877,"49":23641431,"50":41482707,"51":13319200,"52":62163564,"53":3803015,"54":61517563,"55":23947466,"56":26290949,"57":65289037,"58":60566546,"59":14810130,"60":35367640,"61":44421280,"62":11088977,"63":43787522,"64":66118435,"65":56854062,"66":44443960,"67":13078625,"68":13121233,"69":10509969,"70":50536906,"71":21243006,"72":32737361,"73":42690299,"74":62642263,"75":58830798,"76":52533710,"77":35676616,"78":166378,"t":79,"s":0},"p":{"0":578385,"1":60746124,"2":35686229,"3":26569447,"4":32038013,"5":37657710,"6":24933975,"7":12047174,"8":42323956,"9":46769214,"10":21422726,"11":9385475,"12":538344,"13":18915178,"14":57765996,"15":39549653,"16":16830371,"17":14982326,"18":56551196,"19":25202838,"20":60427230,"21":30847202,"22":29938786,"23":60704894,"24":61626705,"25":59921067,"26":9356945,"27":24259887,"28":28499132,"29":38579373,"30":60338111,"31":11793913,"32":32090328,"33":11320553,"34":20451030,"35":63350201,"36":10048827,"37":39511852,"38":6443844,"39":660,"t":40,"s":0},"q":{"0":1148183,"1":2689742,"2":61666178,"3":1230187,"4":11933968,"5":47443848,"6":48038630,"7":59763250,"8":32514460,"9":53759167,"10":8751230,"11":43865572,"12":19949218,"13":44529311,"14":33579452,"15":62621500,"16":53254557,"17":42609031,"18":43700061,"19":18306731,"20":42618117,"21":15623917,"22":41242573,"23":54967795,"24":8612844,"25":54526356,"26":2363077,"27":23403544,"28":4363359,"29":37966384,"30":62700577,"31":50001775,"32":67098224,"33":59619151,"34":20927634,"35":18544356,"36":13135559,"37":59429493,"38":7619081,"39":580,"t":40,"s":0},"dmp1":{"0":8257553,"1":54096390,"2":22174993,"3":58682261,"4":64803285,"5":34798609,"6":22034785,"7":30983558,"8":40536650,"9":3725061,"10":7610038,"11":42664173,"12":18966608,"13":56535366,"14":6059597,"15":32188004,"16":7094047,"17":35878629,"18":46015109,"19":43847792,"20":36541399,"21":48348580,"22":59044892,"23":55336303,"24":59567574,"25":41758707,"26":15384827,"27":2298211,"28":20947048,"29":19884400,"30":17513501,"31":10732731,"32":36502804,"33":56497413,"34":34947514,"35":3472676,"36":29794875,"37":32835039,"38":55939801,"39":198,"40":63498485,"41":33414950,"42":8258035,"43":9382750,"44":31888623,"45":20563578,"46":67003699,"47":19593099,"48":27687748,"49":17452362,"50":56896913,"51":25091329,"52":5557843,"53":25514882,"54":27914957,"55":64748543,"56":48753402,"57":7518566,"58":37177184,"59":32495877,"60":62688648,"61":41145118,"62":41141295,"63":37669739,"64":55115468,"65":55362850,"66":18962837,"67":6266140,"68":65368520,"69":53989102,"70":41753492,"71":15069242,"72":12391732,"73":67026982,"74":8203974,"75":5490160,"76":59890344,"77":16346437,"78":3490616,"79":252,"t":40,"s":0},"dmq1":{"0":32088355,"1":37822813,"2":50855218,"3":54510370,"4":4807811,"5":26854440,"6":17830330,"7":33602011,"8":10838716,"9":13017314,"10":17709236,"11":63587770,"12":46402851,"13":38236479,"14":5174932,"15":48838454,"16":27198298,"17":37544774,"18":54801985,"19":55061887,"20":20148374,"21":24110166,"22":47212594,"23":19833412,"24":59852431,"25":10725003,"26":41568417,"27":40063336,"28":44833450,"29":38511020,"30":51046402,"31":30187338,"32":26376353,"33":27669064,"34":37185952,"35":4970668,"36":36885349,"37":47783756,"38":39431505,"39":527,"40":51018397,"41":55100826,"42":35167764,"43":26116411,"44":838712,"45":16838977,"46":29621563,"47":58901366,"48":25095298,"49":66757301,"50":30449085,"51":39939851,"52":50902698,"53":25096740,"54":40008833,"55":2191670,"56":7717058,"57":37488231,"58":63762759,"59":4310800,"60":2627454,"61":49617976,"62":49276527,"63":37342383,"64":10324693,"65":57045291,"66":14756895,"67":14393868,"68":21845153,"69":63220422,"70":60334283,"71":65283388,"72":12889162,"73":16815288,"74":40503280,"75":10285062,"76":65960797,"77":16937004,"78":53915021,"79":286,"t":40,"s":0},"coeff":{"0":65716281,"1":42783979,"2":11169837,"3":52847360,"4":27422067,"5":65310898,"6":36490367,"7":57854725,"8":47258761,"9":14718211,"10":9541129,"11":2733683,"12":63054097,"13":64352109,"14":56378025,"15":60357732,"16":35019793,"17":24765303,"18":34251749,"19":16319678,"20":17676694,"21":46781447,"22":37188180,"23":60877193,"24":43776614,"25":57097290,"26":66741565,"27":59916519,"28":20081670,"29":63397992,"30":50023858,"31":49622775,"32":1541636,"33":25269801,"34":40105962,"35":32034850,"36":64893505,"37":44960640,"38":25556052,"39":554,"t":40,"s":0},"isPrivate":true,"isPublic":true}`);

let kp = genKey();

let cfg = {
  DIFFICULTY: 2,
  MINING_REWARD: 12.5,
  CURRENCY: 'XSC',
  BANK: {
    pk: kp.pk, //PUB,
    sk: kp.sk, //PRV,
    amount: 1e8,
    wallet: null,
    pool: new UTPool(),
    address: SHA256(kp.pk, 'sxcBank'),
  },
  TRANSACTION_FEE: 1,
  BLOCKCHAIN: null
};

/**
 * @description Initialise the configuration's blockchain, bank's wallet and bank's address.
 * @param {Blockchain} [blockchain] Blockchain to link
 * @param {UTPool} [pool=cfg.BANK.pool] UT pool
 * @param {string} [beneficiaryAddr=cfg.BANK.address] Beneficiary address of the genesis blocks
 */
cfg.init = (blockchain, pool = cfg.BANK.pool, beneficiaryAddr = cfg.BANK.address) => {
  cfg.BLOCKCHAIN = blockchain || new Blockchain(cfg.DIFFICULTY, pool, Blockchain.createGenesisBlock(beneficiaryAddr));
  cfg.BANK.wallet = new Wallet(cfg.BLOCKCHAIN, 'sxcBank', kp);
  cfg.BANK.address = cfg.BANK.wallet.address;
  cfg.BANK.pool.addUT(cfg.BANK.address, cfg.BANK.amount);
};

module.exports = cfg;