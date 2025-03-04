const removeExtension = (fileName: string): string => {
    return <string>fileName.split('.').shift()
}

export default removeExtension;