import SQL from 'mssql';
import config from '../webapp-config.json' assert { type: 'json' };

export default class IFSConsignment{
    constructor(connote){
        this.data = connote,
        this.keyMapping = {
            Company: SQL.VarChar(),
            PackNum: SQL.Int,
            TrackingNumber: SQL.NVarChar(50)
        }
    }

    async newQuery(paramObj){

        if(!this.pool){

            const { server, database, user, password } = config;

            this.pool = await SQL.connect({
                server,
                user,
                password,
                database,
                options: {
                    trustServerCertificate: true,
                    encrypt: false
                }
            })            

        }

        let sqlTr = await this.pool.request();
        Object.entries(paramObj).map(([ key, value ]) => {

            let sqlType = this.keyMapping[key];
            if(!sqlType) throw new Error(`No SQLType for key ${key}.`);
            
            sqlTr.input(key, sqlType, value)

        });

        return sqlTr

    }


    async checkPackingIDExists(company, packNum){

        try {
            
            let query = await this.newQuery({ Company: company, PackNum: packNum });

            return Boolean((await query.query(`SELECT dbo.IFS_PackingID_Exists(@Company, @PackNum)`)).recordset.length)

        } catch (e) {
            throw new Error(`Failed to run CheckPackIDExists. Error: ${e.message}`)
        }

    }
    
    async checkTransferIDExists(company, packNum){
        
        try {

            let query = await this.newQuery({ Company: company, PackNum: packNum });

            return Boolean((await query.query(`SELECT dbo.IFS_TransferID_Exists(@Company, @PackNum)`)).recordset.length)

        } catch (e) {
            throw new Error(`Failed to run CheckTransferIDExists. Error: ${e.message}`)
        }

    }
    
    async updateTrackingPerPackingID(company, packNum, trackingNumber){
        
        try {

            let query = await this.newQuery({ Company: company, PackNum: packNum, TrackingNumber: trackingNumber });

            return await query.execute('dbo.IFS_Update_Tracking_Per_PackingID')

        } catch (e) {
            throw new Error(`Failed to run UpdateTrackingPerPackingID. Error: ${e.message}`)
        }

    }
    
    async updateTrackingPerTransferID(company, packNum, trackingNumber){
     
        try {

            let query = await this.newQuery({ Company: company, PackNum: packNum, TrackingNumber: trackingNumber });

            return await query.execute('dbo.IFS_Update_Tracking_Per_TransferID')
            

        } catch (e) {
            throw new Error(`Failed to run UpdateTrackingPerTransferID. Error: ${e.message}`)
        }
        
    }

}

