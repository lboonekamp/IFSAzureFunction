import IFSConsignment from './components/Sql.Database.Component.mjs';

export default async function(context, req) {

    const log = message => context.log(message);

    log(77, req.headers)
    
    log(`Server: ${process.env.server}. Database: ${process.env.database}.`);

    // Reference Doc:
    // - https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-node?tabs=v2-v3-v4-export%2Cv2-v3-v4-done%2Cv2%2Cv2-log-custom-telemetry%2Cv2-accessing-request-and-response%2Cwindows-setting-the-node-version
    let responseBody = {}, statCode;

    try { 

        let { bureauid: siteID, connotenumber: consignmentNumber, creatorid, trackingid, freightlinedetails } = req.body;
    
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
        
        let Consignment = new IFSConsignment(req.body);

        log(`IFS WebService.Consignment.UpdateTrackingID received a request for Site: ${siteID}...`);
        log(`Consignment ${consignmentNumber}. Total to process: ${freightlinedetails.length}`);

        const tzSiteID = ['P6O', 'K7X'].includes(siteID) ? 'TZNZ' : 'TZA';

        let processed = await Promise.allSettled(
            freightlinedetails.map(async ({ ref: packNum }) => {

                try {
                    
                    let baseArgs = [ tzSiteID, packNum ], updated = { packNum };
                    
                    const packIDExists = await Consignment.checkPackingIDExists(...baseArgs);
                    log(`PackIDExists: ${packIDExists}`);

                    if(packIDExists){

                        updated.updateTrackingPerTransferIDRequired = true;

                        // Run update
                        await Consignment.updateTrackingPerTransferID(...baseArgs, trackingid);

                        updated.updateTrackingPerTransferID = 'done'
                        
                    }

                    const transferIDExists = await Consignment.checkTransferIDExists(...baseArgs);
                    log(`TransferIDExists: ${packIDExists}`);

                    if(transferIDExists){

                        updated.updateTrackingPerPackingIDRequired = true;

                        // Run update
                        await Consignment.updateTrackingPerPackingID(...baseArgs, trackingid);                    

                        updated.updateTrackingPerPackingID = 'done' 

                    }

                    return updated

                } catch (e) {
                    log(e.message)
                    throw new Error(`PackingNumber ${packNum}. Error: ${e.message}`)
                }


            })
        );

        let failedTrackingIDUpdates =  processed.filter(response => response.status === 'rejected');
        const failedCount = failedTrackingIDUpdates.length;
        let failedErrorString;
        if(failedCount){

            failedTrackingIDUpdates = failedTrackingIDUpdates.map(response => response.reason);

            failedErrorString = failedTrackingIDUpdates.join("\r\n");

            log(`Failures: ${failedCount}. Failed PackNums: ${failedErrorString}`)

        }

        processed = processed.filter(resp => resp.status === 'fulfilled' && resp?.value && typeof resp.value === 'object').map(resp =>  resp.value);
        const successfulCount = processed.length;

        log(`TotalFailed: ${failedCount}. TotalSuccessful: ${successfulCount}`);

        if(failedCount === successfulCount) throw new Error(`All PackNums failed to be updated. Errors: ${failedErrorString}.`);
        
        responseBody.data = {
            company: tzSiteID,
            consignmentNumber,
            trackingNumber: trackingid,
            processed,
            ...(failedCount ? { failed: failedTrackingIDUpdates } : {})
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