import { IFile, DepType } from "./IFile";
import { CFFile } from "./CFFile";
export class Manifest {
    name: string;
    version: string = "1.0.0";
    gameVersion: string = "";
    forgeVersion: string = "";
    description: string;
    author: string;
    dependencies: IFile[] = [];

    constructor(name?: string, gameVersion?: string, description?: string, author?: string) {
        this.name = name;
        this.description = description;
        this.author = author;
        this.gameVersion = gameVersion;
    }

    getDeps(type?: DepType) {
        return type ? this.dependencies.filter(el => el.getDepType() === type) : this.dependencies;
    }

    addDep(dep: IFile) {
        let ls = this.dependencies.filter(el => el.equals(dep));
        if (ls.length > 0) {
            this.dependencies = this.dependencies.filter(el => !ls.includes(el));
        } else {
        }
        this.dependencies.push(dep);
        //process.exit(0);
    }

    toJSON(): any {
        const dependencies = this.getDeps(DepType.COMMON).map(el => el.toJSON());
        const clientDependencies = this.getDeps(DepType.CLIENT).map(el => el.toJSON());
        const serverDependencies = this.getDeps(DepType.SERVER).map(el => el.toJSON());


        return Object.assign({ ...this }, {
            dependencies,
            clientDependencies,
            serverDependencies
        })
    }

    static fromJSON(str: string): Promise<Manifest> {
        return new Promise(async (resolve, reject) => {
            const obj = JSON.parse(str);

            const deps: IFile[] = [...(obj.dependencies || []), ...(obj.clientDependencies || []), ...(obj.serverDependencies || [])];
            //delete obj.clientDependencies;
            //delete obj.serverDependencies;

            const manifest = Object.assign(new Manifest(), obj) as Manifest;

            manifest.dependencies = [];

            await Promise.all(deps.map(async (el: any) => {
                let file: IFile;

                if (typeof el.projectId === 'number' && typeof el.fileId === 'number') {
                    file = CFFile.fromJSON(manifest, el) as unknown as IFile;
                }

                if (file) {
                    const fa = file as any;
                    if (obj.clientDependencies && obj.clientDependencies.includes(el)) {
                        fa.depType = DepType.CLIENT;
                    }
                    if (obj.serverDependencies && obj.serverDependencies.includes(el)) {
                        fa.depType = DepType.SERVER;
                    }
                }

                return file;
            })).then(d => {
                d.forEach(el => manifest.addDep(el));
                resolve(manifest);
            });
        })
    }
}
