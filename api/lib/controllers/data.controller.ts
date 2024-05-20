import Controller from '../interfaces/controller.interface';
import {Request, Response, NextFunction, Router, response} from 'express';
import {checkIdParam} from "../middlewares/deviceIdParam.middleware";
import DataService from "../modules/services/data.service";
import {IData} from "../modules/models/data.model";
import Joi from "joi";

let testArr = [4,5,6,3,5,3,7,5,13,5,6,4,3,6,3,6];

class DataController implements Controller {
   public path = '/api/data';
   public router = Router();
   private dataService: DataService;

   constructor() {
       this.initializeRoutes();
   }

   private initializeRoutes() {
       this.router.get(`${this.path}/latest`, this.getLatestReadingsFromAllDevices);
       this.router.post(`${this.path}/:id`, checkIdParam, this.addData);
       this.router.get(`${this.path}/:id`, checkIdParam, this.getAllDeviceData);
       this.router.get(`${this.path}/:id/latest`, checkIdParam, this.getPeriodData);
       this.router.get(`${this.path}/:id/:num`, checkIdParam, this.getDataByIdRange);
       this.router.delete(`${this.path}/all`, this.cleanAllDevices);
       this.router.delete(`${this.path}/:id`, checkIdParam, this.cleanDeviceData);

   }

    private addData = async (request: Request, response: Response, next: NextFunction) => {

        const { air } = request.body;
        const id  = parseInt(request.params.id);

        const schema = Joi.object({
            air: Joi.array()
                .items(
                    Joi.object({
                        id: Joi.number().integer().positive().required(),
                        value: Joi.number().positive().required()
                    })
                )
                .unique((a, b) => a.id === b.id),
                    deviceId: Joi.number().integer().positive().valid(parseInt(String(id), 10)).required()
        });

        const readingData: IData = {
           temperature: air[0].value,
           pressure: air[1].value,
           humidity: air[2].value,
           deviceId: id
        }

       try {

           await this.dataService.createData(readingData);
           response.status(200).json(readingData);
       } catch (error) {
           console.error(`Validation Error: ${error.message}`);
           response.status(400).json({ error: 'Invalid input data.' });
        }

    }

    private getLatestReadingsFromAllDevices = async (request: Request, response: Response, next: NextFunction) => {

       response.status(200).json(testArr);
    }

    private getAllDeviceData = async (request: Request, response: Response, next: NextFunction) => {
        const { id } = request.params;
        const allData = await this.dataService.query(id);
        response.status(200).json(allData);
    };

     private getPeriodData = async (request: Request, response: Response, next: NextFunction) => {
        const id = parseInt(request.params.id);

        const latestData = Math.max(...testArr.filter((value, index) => index === id));
        response.status(200).json(latestData);
    };

    private getDataByIdRange = async (request: Request, response: Response, next: NextFunction) => {
        const id = parseInt(request.params.id);
        const num = parseInt(request.params.num);


        const dataInRange = testArr.slice(id, id + num);
        response.status(200).json(dataInRange);
    };

    private cleanAllDevices = async (request: Request, response: Response, next: NextFunction) => {
        testArr = [];
        response.status(200).json(testArr);
    };

    private cleanDeviceData = async (request: Request, response: Response, next: NextFunction) => {
        const id = parseInt(request.params.id);

        testArr.splice(id, 1);
        response.status(200).json(testArr);
    };
}

export default DataController;