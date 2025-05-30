using {inv as mysim} from '../models/inv-simulation';


@impl: 'src/api/controllers/sec-simulation-controller.js'
service SimulationsRouter @(path: '/api/security/inversions') {

    entity Entsimulation as projection on mysim.SIMULATION;

    @Core.Description: 'simulations'
    @path            : 'simulation'
    action simulation(SIMULATION : Entsimulation) returns array of Entsimulation;

}
