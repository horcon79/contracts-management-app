import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
    key: string;
    value: any;
    updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
    {
        key: {
            type: String,
            required: true,
            unique: true,
        },
        value: {
            type: Schema.Types.Mixed,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;
