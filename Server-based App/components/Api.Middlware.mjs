export function buildValidateClient() {

    const ifsIPAddress = '20.211.41.33';

    const ipMatcher = new RegExp(`${ifsIPAddress}`);

    return function (req, res, next){

        const { headers } = req;

        const ip = headers['x-forwarded-for'];

        if(!ipMatcher.test(ip)){
            return res.status(403).send({
                Message: 'Forbidden'
            })
        }

        next()

    }

}

export function validateFunctionKey(functionKey){

    return function (req, res, next){

        const { [x-functions-key]: incomingKey } = req.headers;
        
        if(incomingKey !== functionKey){
            res.status(403).send({
                Message: 'Forbidden'
            })
        }

        next()

    }
    

}

export function removeHeaders(req, res, next){

    res.removeHeader('X-Powered-By');

    next()

}