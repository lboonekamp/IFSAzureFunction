import IFSConsignment from './components/Sql.Database.Component.mjs';

export default async function(context, req) {
 
    const log = message => context.log(message);

    // Reference Doc:
    // - https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-node?tabs=v2-v3-v4-export%2Cv2-v3-v4-done%2Cv2%2Cv2-log-custom-telemetry%2Cv2-accessing-request-and-response%2Cwindows-setting-the-node-version

    log('IFS WebService.Consignment.UpdateTrackingID received a request...');

    let responseBody = {}, statCode;

    try { 

        let { bureauid: siteID, connotenumber: consignmentNumber, creatorid, trackingid, freightlinedetails } = req.body;
        
        let Consignment = new IFSConsignment(req.body);
    
        // Only handle ones that have been 'Imported'
        if(creatorid === 'IMPORT_ERROR'){
            statCode = 204;
            throw new Error(`Invalid CreatorID. Expecting a value not equal to 'IMPORT_ERROR', received; ${creatorid}.`)
        }
    
        if(!trackingid){
            statCode = 400;
            throw new Error(`Invalid TrackingID received. Expecting a string, received ${typeof trackingid}.`)
        }

        if(!freightlinedetails.length){
            statCode = 400;
            throw new Error(`Bad request. No FreightLineDetails (PackNums) to process for Consignment ${consignmentNumber}.`)
        }

        if(!consignmentNumber){
            statCode = 400;
            throw new Error(`Bad request. No ConsignmentNumber present.`)
        }

        log(`Beginning Import for Site: ${siteID}...`);
        log(`Consignment ${consignmentNumber}. Total to process: ${freightlinedetails.length}`);

        const tzSiteID = ['P6O', 'K7X'].includes(siteID) ? 'TZNZ' : 'TZA';

        const processed = await Promise.allSettled(
            freightlinedetails.map(async ({ ref: packNum }) => {

                let baseArgs = [ tzSiteID, packNum ], updated = { packNum };

                if(await Consignment.checkPackingIDExists(...baseArgs)){

                    updated.updateTrackingPerTransferIDRequired = true;

                    // Run update
                    await Consignment.updateTrackingPerTransferID(...baseArgs, trackingid);

                    updated.updateTrackingPerTransferID = 'done'
                    
                }

                if(await Consignment.checkTransferIDExists(...baseArgs)){

                    updated.updateTrackingPerPackingIDRequired = true;

                    // Run update
                    await Consignment.updateTrackingPerPackingID(...baseArgs, trackingid);                    

                    updated.updateTrackingPerPackingID = 'done' 

                }

                return updated

            })
        );
        
        responseBody.data = {
            company: tzSiteID,
            consignmentNumber,
            trackingNumber: trackingid,
            processed: processed.map(resp =>  resp.value)
        }

    } catch (e) {
        
        if(!statCode) statCode = 500;

        responseBody.message = e.message;

        log(e.message)
  
    }

    responseBody.status = statCode;

    context.res = {
        body: responseBody,
        status: statCode || 200
    }

}