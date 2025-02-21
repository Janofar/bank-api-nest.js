import { Types } from "mongoose";

export interface UserData {
    name : string,
    email : string,
    password : string
}

export interface UserProfile{
    _id : Types.ObjectId;
    name : string,
    email : string,
}
