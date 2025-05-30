
using {inv as myinv} from '../models/inv-investments';

@impl: 'src/api/controllers/inv-investments-controller.js'

service InvestmentsRoute @(path:'/api/inv'){

    entity priceshistory as projection on myinv.priceshistory;
    entity strategies as projection on myinv.strategies;

    @Core.Description: 'get-all-prices-history'
    @path :'getall'
        function getall()
        returns array of priceshistory;

    @Core.Description: 'add-one-price-history'
    @path :'addone'
        action addone(prices: priceshistory)
        returns array of priceshistory;

    @Core.Description: 'update-one-price-history'
    @path :'updateone'
        action updateone(prices: priceshistory)
        returns array of priceshistory;

    @Core.Description: 'delete-one-price-history'
    @path :'deleteone'
        action deleteone(prices: priceshistory)
        returns array of priceshistory;

}