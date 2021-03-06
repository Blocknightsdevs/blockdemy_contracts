const diamond = require('../js/diamond-util/src/index.js')

function addCommas(nStr) {
    nStr += ''
    const x = nStr.split('.')
    let x1 = x[0]
    const x2 = x.length > 1 ? '.' + x[1] : ''
    var rgx = /(\d+)(\d{3})/
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2')
    }
    return x1 + x2
}

function strDisplay(str) {
    return addCommas(str.toString())
}

async function main() {

    console.log('SCRIPT NAME: should pass as argument we have empty for now')

    const accounts = await ethers.getSigners()
    const account = await accounts[0].getAddress()
    console.log('Account: ' + account)
    console.log('---')


    //for showing gas used
    let totalGasUsed = ethers.BigNumber.from('0')


    async function deployFacets(...facets) {
        const instances = []
        for (let facet of facets) {
            let constructorArgs = []
            if (Array.isArray(facet)) {
                [facet, constructorArgs] = facet
            }
            const factory = await ethers.getContractFactory(facet)
            const facetInstance = await factory.deploy(...constructorArgs)
            await facetInstance.deployed()
            const tx = facetInstance.deployTransaction
            const receipt = await tx.wait()
            console.log(`${facet} deploy gas used:` + strDisplay(receipt.gasUsed))
            totalGasUsed = totalGasUsed.add(receipt.gasUsed)
            instances.push(facetInstance)
        }
        return instances
    }


    //deploy facets
    let [
        blockdemyCourseFacet,
        blockdemyCourseVideosFacet,
        blockdemyCourseEditFacet,
        blockdemyFacet,
        blockdemyTokenFacet
    ] = await deployFacets(
        'BlockdemyCourseFacet',
        'BlockdemyCourseVideosFacet',
        'BlockdemyCourseEditFacet',
        'BlockdemyFacet',
        'BlockdemyTokenFacet'
    )


    //deploy diamonds
    let name = 'BDEMY Course'
    let symbol = 'BDEMYC'
    const blockdemyCourseDiamond = await diamond.deploy({
        diamondName: 'BlockdemyCourseDiamond',
        initDiamond: 'contracts/BlockdemyCourses/InitDiamond.sol:InitDiamond',
        facets: [
            ['BlockdemyCourseFacet', blockdemyCourseFacet],
            ['BlockdemyCourseVideosFacet', blockdemyCourseVideosFacet],
            ['BlockdemyCourseEditFacet', blockdemyCourseEditFacet]
        ],
        owner: account,
        args: [[name, symbol]]
    })

    name="Blockdemy Token";
    symbol="BDEMY";
    const blockdemyTokenDiamond = await diamond.deploy({
        diamondName: 'BlockdemyTokenDiamond',
        initDiamond: 'contracts/BlockdemyToken/InitDiamond.sol:InitDiamond',
        facets: [
            ['BlockdemyTokenFacet', blockdemyTokenFacet]
        ],
        owner: account,
        args: [[name, symbol]]
    })


    const blockdemyDiamond = await diamond.deploy({
        diamondName: 'BlockdemyDiamond',
        initDiamond: 'contracts/Blockdemy/InitDiamond.sol:InitDiamond',
        facets: [
            ['BlockdemyFacet', blockdemyFacet]
        ],
        owner: account,
        args: [[ blockdemyCourseDiamond.address, blockdemyTokenDiamond.address]]
    })



    // set post diamonds deployment data //
    blockdemyCourseFacet = await ethers.getContractAt('BlockdemyCourseFacet', blockdemyCourseDiamond.address);
    blockdemyTokenFacet = await ethers.getContractAt('BlockdemyTokenFacet', blockdemyTokenDiamond.address);

    //set blockdemy to course
    console.log('Set blockdemy to blockdemy course');
    await blockdemyCourseFacet.setBlockdemy(blockdemyDiamond.address, {from:account });

    //mint tokens to blockdemy
    let totalSupply = "100000000000000000000000000000"; //100BN TOKENS blockdemyToken
    let totalSupplyBN = ethers.BigNumber.from(totalSupply);
    await blockdemyTokenFacet.mint(blockdemyDiamond.address, totalSupplyBN, {from:account });


    //final prints
    tx = blockdemyCourseDiamond.deployTransaction
    receipt = await tx.wait()
    console.log('Blockdemy diamond deploy gas used:' + strDisplay(receipt.gasUsed))
    totalGasUsed = totalGasUsed.add(receipt.gasUsed)

    console.log("const blockdemyCourseDiamondAddress=\""+blockdemyCourseDiamond.address+"\";");
    console.log("const blockdemyTokenDiamondAddress=\""+blockdemyTokenDiamond.address+"\";");
    console.log("const blockdemyDiamondAddress=\""+blockdemyDiamond.address+"\";");
    //console.log('blockdemyTokenFacet address: '+blockdemyTokenFacet.address) 


}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
}

exports.deployProject = main