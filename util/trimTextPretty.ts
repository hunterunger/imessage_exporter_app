export default function trimTextPretty(
    text: string,
    maxLength: number,
    fromStart: boolean = false
): string {
    if (text.length <= maxLength) {
        return text;
    }

    const ellipsis = "...";
    const lengthWithoutEllipsis = maxLength - ellipsis.length;

    if (fromStart) {
        return ellipsis + text.slice(text.length - lengthWithoutEllipsis);
    }

    return text.slice(0, lengthWithoutEllipsis) + ellipsis;
}
